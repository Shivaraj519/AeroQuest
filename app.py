from flask import Flask, render_template, request, jsonify
import requests
import database

app = Flask(__name__)

# Initialize the database when the app starts
database.init_db()

@app.route('/')
def index():
    """Serves the main SPA template."""
    return render_template('index.html')

@app.route('/api/search')
def search_city():
    """Proxies city search requests to the Open-Meteo Geocoding API."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'results': []})
        
    try:
        # Save query to database search history
        database.add_search_query(query)
        
        # Call geocoding API
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={requests.utils.quote(query)}&count=8&language=en&format=json"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = data.get('results', [])
        return jsonify({'results': results})
    except Exception as e:
        return jsonify({'error': str(e), 'results': []}), 500

@app.route('/api/air-quality')
def get_air_quality():
    """Fetches and blends air quality and current weather data for given coordinates."""
    lat = request.args.get('latitude')
    lon = request.args.get('longitude')
    
    if not lat or not lon:
        return jsonify({'error': 'Latitude and Longitude are required'}), 400
        
    try:
        # 1. Fetch Air Quality Data
        aqi_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}"
            f"&current=us_aqi,european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index"
            f"&hourly=us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone"
            f"&timezone=auto"
        )
        aqi_response = requests.get(aqi_url, timeout=10)
        aqi_response.raise_for_status()
        aqi_data = aqi_response.json()
        
        # 2. Fetch Weather Data
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m"
            f"&timezone=auto"
        )
        weather_response = requests.get(weather_url, timeout=10)
        weather_response.raise_for_status()
        weather_data = weather_response.json()
        
        # 3. Fetch WAQI Data (Ground Station Real-time Data)
        waqi_aqi = None
        station_name = None
        waqi_token = request.args.get('token', '').strip()
        if not waqi_token:
            waqi_token = 'demo'
            
        try:
            waqi_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={waqi_token}"
            waqi_response = requests.get(waqi_url, timeout=5)
            if waqi_response.status_code == 200:
                waqi_json = waqi_response.json()
                if waqi_json.get('status') == 'ok':
                    waqi_data = waqi_json.get('data', {})
                    station_geo = waqi_data.get('city', {}).get('geo')
                    
                    # Sanity check: If station is > 2.0 degrees (~220km) away from queried coords,
                    # treat it as a fake/redirected data and fallback to Open-Meteo.
                    is_redirect = False
                    if station_geo and len(station_geo) >= 2:
                        s_lat, s_lon = float(station_geo[0]), float(station_geo[1])
                        if abs(float(lat) - s_lat) > 2.0 or abs(float(lon) - s_lon) > 2.0:
                            is_redirect = True
                            
                    if not is_redirect:
                        waqi_aqi = waqi_data.get('aqi')
                        station_name = waqi_data.get('city', {}).get('name')
        except Exception:
            pass # Fail gracefully, fallback to Open-Meteo
            
        # Combine the payloads
        result = {
            'latitude': float(lat),
            'longitude': float(lon),
            'current_aqi': aqi_data.get('current', {}),
            'current_weather': weather_data.get('current', {}),
            'hourly_aqi': aqi_data.get('hourly', {}),
            'waqi_aqi': waqi_aqi,
            'station_name': station_name,
            'units': {
                'aqi_units': aqi_data.get('current_units', {}),
                'weather_units': weather_data.get('current_units', {})
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favorites', methods=['GET', 'POST'])
def manage_favorites():
    """Handles fetching bookmarks and adding new bookmarks."""
    if request.method == 'GET':
        favorites = database.get_favorites()
        return jsonify({'favorites': favorites})
        
    elif request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({'error': 'Missing request payload'}), 400
            
        city_name = data.get('city_name')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        country = data.get('country')
        region = data.get('region', '')
        
        if not city_name or latitude is None or longitude is None or not country:
            return jsonify({'error': 'Missing required fields (city_name, latitude, longitude, country)'}), 400
            
        success = database.add_favorite(city_name, latitude, longitude, country, region)
        if success:
            return jsonify({'success': True, 'message': 'City added to favorites'}), 201
        else:
            return jsonify({'success': False, 'message': 'City already in favorites or database error'}), 409

@app.route('/api/favorites/<int:fav_id>', methods=['DELETE'])
def delete_favorite(fav_id):
    """Deletes a favorite city by its unique record ID."""
    success = database.delete_favorite(fav_id)
    if success:
        return jsonify({'success': True, 'message': 'City removed from favorites'})
    else:
        return jsonify({'success': False, 'message': 'City not found or database error'}), 404

@app.route('/api/history', methods=['GET'])
def get_history():
    """Retrieves list of recent searches."""
    history = database.get_recent_searches()
    return jsonify({'history': history})

if __name__ == '__main__':
    app.run(debug=False, host='127.0.0.1', port=5000)
