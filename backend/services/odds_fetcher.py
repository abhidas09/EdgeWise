"""
Odds Fetcher Service
Fetches real-time NBA player props from The Odds API
Based on existing Colab implementation
"""

import requests
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

# API Configuration
API_KEY = os.getenv('ODDS_API_KEY', 'dcbbf0b0a7b4196f3bb0778b20b6da7b')
SPORT = 'basketball_nba'
REGIONS = 'us'
ODDS_FORMAT = 'decimal'
DATE_FORMAT = 'iso'


class OddsFetcher:
    """Fetches and processes NBA player props from The Odds API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or API_KEY
        self.base_url = 'https://api.the-odds-api.com/v4'
    
    def get_event_ids(self) -> List[str]:
        """
        Get list of NBA event IDs
        Returns: List of event IDs
        """
        try:
            response = requests.get(
                f'{self.base_url}/sports/{SPORT}/odds',
                params={
                    'api_key': self.api_key,
                    'regions': REGIONS,
                    'markets': 'h2h',
                    'oddsFormat': ODDS_FORMAT,
                    'dateFormat': DATE_FORMAT,
                }
            )
            
            if response.status_code != 200:
                logger.error(f'Failed to get events: {response.status_code}')
                return []
            
            odds_json = response.json()
            event_ids = [event['id'] for event in odds_json]
            
            logger.info(f'Found {len(event_ids)} NBA events')
            logger.info(f'Remaining requests: {response.headers.get("x-requests-remaining")}')
            
            return event_ids
            
        except Exception as e:
            logger.error(f'Error fetching event IDs: {e}')
            return []
    
    def fetch_props_for_event(self, event_id: str) -> Dict[str, Any]:
        """
        Fetch player props for a specific event
        Args:
            event_id: The event ID to fetch props for
        Returns: Dict with event props data
        """
        try:
            markets = 'player_points,player_rebounds,player_assists'
            # Request odds from all major US sportsbooks
            bookmakers = 'draftkings,fanduel,betmgm,caesars,bovada,pointsbetus'
            
            response = requests.get(
                f'{self.base_url}/sports/{SPORT}/events/{event_id}/odds',
                params={
                    'api_key': self.api_key,
                    'regions': REGIONS,
                    'markets': markets,
                    'oddsFormat': ODDS_FORMAT,
                    'dateFormat': DATE_FORMAT,
                    'bookmakers': bookmakers,  # Add this to get multiple books
                }
            )
            
            if response.status_code != 200:
                logger.error(f'Failed to get odds for event {event_id}: {response.status_code}')
                return {}
            
            return response.json()
            
        except Exception as e:
            logger.error(f'Error fetching props for event {event_id}: {e}')
            return {}
    
    def process_odds(self, odds_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Process raw odds data and calculate best values
        Args:
            odds_json: Raw odds data from API
        Returns: List of processed props with best odds
        """
        if not odds_json or 'bookmakers' not in odds_json:
            return []
        
        data = {}
        bookmakers = set()
        
        # Aggregate odds from all bookmakers
        for bookmaker in odds_json['bookmakers']:
            bookmaker_key = bookmaker['key']
            bookmakers.add(bookmaker_key)
            
            for market in bookmaker['markets']:
                market_key = market['key']
                
                for outcome in market['outcomes']:
                    player_name = outcome['description']
                    line = outcome['point']
                    side = outcome['name']  # 'Over' or 'Under'
                    price = outcome['price']
                    
                    key = (player_name, line, market_key)
                    
                    if key not in data:
                        data[key] = {
                            'over_sum': 0,
                            'under_sum': 0,
                            'count': 0,
                            'bookmakers': []
                        }
                    
                    data[key]['bookmakers'].append({
                        'sportsbook': bookmaker_key,
                        'side': side,
                        'price': price
                    })
                    
                    if side == 'Over':
                        data[key]['over_sum'] += price
                        data[key]['count'] += 1
                    else:
                        data[key]['under_sum'] += price
        
        # Convert to props format
        props = []
        
        for (player_name, line, market_key), values in data.items():
            if values['count'] == 0:
                continue
            
            # Calculate average odds
            over_avg = values['over_sum'] / values['count']
            under_avg = values['under_sum'] / values['count']
            
            # Convert decimal to American odds
            over_american = self.decimal_to_american(over_avg)
            under_american = self.decimal_to_american(under_avg)
            
            # Calculate implied probabilities
            over_prob = self.american_to_probability(over_american)
            under_prob = self.american_to_probability(under_american)
            
            # Calculate true odds (removing vig)
            total_prob = over_prob + under_prob
            true_over_prob = (over_prob / total_prob) * 100
            true_under_prob = (under_prob / total_prob) * 100
            
            # Determine best side and find best bookmaker odds
            if true_over_prob > true_under_prob:
                best_side = 'over'
                best_prob = true_over_prob
                # Find bookmaker with best over odds
                best_book = self.find_best_bookmaker(values['bookmakers'], 'Over')
            else:
                best_side = 'under'
                best_prob = true_under_prob
                # Find bookmaker with best under odds
                best_book = self.find_best_bookmaker(values['bookmakers'], 'Under')
            
            # Calculate edge
            edge = best_prob - 50  # Simple edge calculation
            
            props.append({
                'player': player_name,
                'market': market_key,
                'line': line,
                'best_odds': {
                    'sportsbook': best_book['sportsbook'],
                    'price': int(best_book['price']),
                    'implied': round(best_prob, 1)
                },
                'all_odds': self.format_all_odds(values['bookmakers']),
                'edge': round(edge, 1),
                'best_side': best_side
            })
        
        return props
    
    def find_best_bookmaker(self, bookmakers: List[Dict], side: str) -> Dict:
        """Find bookmaker with best odds for given side"""
        best = None
        best_price = 0
        
        for book in bookmakers:
            if book['side'] == side:
                price = self.decimal_to_american(book['price'])
                if best is None or price > best_price:
                    best_price = price
                    best = {
                        'sportsbook': book['sportsbook'],
                        'price': price
                    }
        
        return best if best else {'sportsbook': 'Unknown', 'price': 0}
    
    def format_all_odds(self, bookmakers: List[Dict]) -> List[Dict]:
        """Format odds from all bookmakers with both over and under"""
        formatted = {}
        
        for book in bookmakers:
            sportsbook = book['sportsbook']
            side = book['side'].lower()
            price = self.decimal_to_american(book['price'])
            
            if sportsbook not in formatted:
                formatted[sportsbook] = {
                    'sportsbook': sportsbook,
                    'over': None,
                    'under': None
                }
            
            formatted[sportsbook][side] = int(price)
        
        # Filter out incomplete entries (must have both over and under)
        complete_odds = [
            odds for odds in formatted.values() 
            if odds['over'] is not None and odds['under'] is not None
        ]
        
        return complete_odds
    
    def decimal_to_american(self, decimal_odds: float) -> int:
        """Convert decimal odds to American odds"""
        if decimal_odds >= 2:
            return int((decimal_odds - 1) * 100)
        else:
            return int(-100 / (decimal_odds - 1))
    
    def american_to_probability(self, american_odds: int) -> float:
        """Convert American odds to implied probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return -american_odds / (100 - american_odds)
    
    def fetch_all_props(self) -> List[Dict[str, Any]]:
        """
        Fetch and process all NBA player props
        Returns: List of all props with best odds (limited to top 200 by edge)
        """
        all_props = []
        
        # Get event IDs
        event_ids = self.get_event_ids()
        logger.info(f'Fetching props for {len(event_ids)} events')
        
        # Fetch props for each event
        for event_id in event_ids[:5]:  # Limit to 5 events to conserve API quota
            odds_json = self.fetch_props_for_event(event_id)
            if odds_json:
                props = self.process_odds(odds_json)
                all_props.extend(props)
        
        # Sort by edge (highest first) and limit to top 200
        all_props_sorted = sorted(all_props, key=lambda x: x.get('edge', 0), reverse=True)[:200]
        
        logger.info(f'Processed {len(all_props)} total props, returning top 200')
        return all_props_sorted


# Convenience function
def get_nba_props() -> List[Dict[str, Any]]:
    """
    Get all NBA player props
    Returns: List of props with best odds
    """
    fetcher = OddsFetcher()
    return fetcher.fetch_all_props()


if __name__ == "__main__":
    # Test the fetcher
    props = get_nba_props()
    print(f"Found {len(props)} props")
    for prop in props[:5]:
        print(f"{prop['player']} - {prop['market']} {prop['best_side']} {prop['line']}: {prop['best_odds']}")