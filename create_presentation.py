import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def create_deck():
    prs = Presentation()
    
    # Configure 16:9 widescreen slides
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    
    # Custom Color System (High-Tech Dark Theme)
    DARK_BG = RGBColor(9, 13, 22)       # App deep dark background
    WHITE = RGBColor(243, 244, 246)     # Primary text
    EMERALD = RGBColor(16, 185, 129)    # Emerald Green accent
    MUTED_GRAY = RGBColor(156, 163, 175)# Secondary text
    
    # Slide data model
    slides_data = [
        # Slide 1: Title
        {
            "type": "title",
            "title": "AeroQuest",
            "subtitle": "Advanced PYTHON & Flask Web Application for Global Air Quality & Weather Analytics",
            "students": [
                "SHIVARAJ (25SUUBECS1323) | SHIVAKUMAR KH (25SUUBECS1319)",
                "SHREYAS AG (25SUUBECS1351) | SHREYAS HS (25SUUBECS1354)",
                "SHREYAS SUVIGYA (25SUUBECS1361)"
            ]
        },
        # Slide 2: Project Vision & Core Features
        {
            "type": "content",
            "title": "1. Project Vision & Core Features",
            "bullets": [
                "Democratize global atmospheric and air quality monitoring.",
                "Fuse real-time meteorology (wind, humidity, temp) with pollutant metrics.",
                "Automate public health recommendations tailored for active lifestyles.",
                "Provide an out-of-the-box system that requires no complex configurations.",
                "Bridge the gap between raw data formats and interactive visual user dashboards."
            ]
        },
        # Slide 3: Tech Stack
        {
            "type": "content",
            "title": "2. The Technical Stack",
            "bullets": [
                "Core Language: PYTHON 3.13.",
                "Backend Controller: Flask microframework.",
                "Database Caching: SQLite3 for favorites and search logs.",
                "Integrations: Open-Meteo REST APIs (Geocoding & Air Quality).",
                "Ground Station Feeds: WAQI API (Real-time air pollution indexes).",
                "Visualization: Chart.js (Historical trends) and Leaflet.js (GIS Mapping)."
            ]
        },
        # Slide 4: API Redirect Fallback Logic
        {
            "type": "content",
            "title": "3. WAQI API Redirect Fallback Logic",
            "bullets": [
                "The Challenge: WAQI 'demo' token geolocated requests force-redirect to Shanghai.",
                "The Solution: Implemented latitude/longitude coordinate distance verification checks.",
                "The Logic: If returned station coordinates differ from queried coordinates by > 2.0 degrees, the redirect is flagged as hijack.",
                "Fallback Path: Backend discards fake station data and falls back to localized Open-Meteo forecasts.",
                "Token Settings: User input widget in sidebar footer saves custom WAQI token in localStorage."
            ]
        },
        # Slide 5: Relational SQLite Schema
        {
            "type": "content",
            "title": "4. Database Architecture (database.py)",
            "bullets": [
                "Relational tables built for search_history and favorites.",
                "Unique Constraints: Prevents duplicate bookmarks on coordinates (lat/long combinations).",
                "Automatic Pruning: Caches only the latest 10 recent searches to prevent database bloating.",
                "Server-side Synchronization: Keeps user data safe and loads bookmarks dynamically on launch."
            ]
        },
        # Slide 6: WHO Exceedance Alerts
        {
            "type": "content",
            "title": "5. WHO Exceedance Alert System",
            "bullets": [
                "Analytical Engine: Calculates active health warnings when pollutants exceed WHO 24h safety standards.",
                "Unit Conversion: Divides Carbon Monoxide (CO) concentration by 1000 to scale from micrograms to milligrams, preventing false warnings.",
                "Ratio Math: Multiplier = Concentration / WHO safe limit.",
                "Dynamic UI: Highlights exceedance multipliers (e.g. 'PM2.5 is 2.4x above WHO safe limit')."
            ]
        },
        # Slide 7: Weather-AQI Correlation
        {
            "type": "content",
            "title": "6. Weather-AQI Correlation Engine",
            "bullets": [
                "Meteorological Rules: Combines wind speed, relative humidity, and temperatures.",
                "Stagnation Alerts: Warns users when wind speed < 10 km/h and humidity > 80% that local atmospheric conditions are trapping particulates.",
                "Dispersion Insights: Explains how high winds (> 15 km/h) disperse chemical pollutants.",
                "Aesthetic Cards: Dynamic insights card rendered seamlessly next to the gauge."
            ]
        },
        # Slide 8: Cleanest City Leaderboard
        {
            "type": "content",
            "title": "7. Cleanest City Leaderboard",
            "bullets": [
                "Dynamic Sorting: Compiles favorites list in real-time, fetching active air quality readings.",
                "Sort Order: Automatically ranks cities ascending (cleanest to most polluted).",
                "Premium Visuals: Uses customized ranking badges, layout transitions, and green-to-red severity indicators.",
                "Asynchronous Grid: Automatically updates as favorites are bookmarked or removed."
            ]
        },
        # Slide 9: UI/UX & Interactive GIS
        {
            "type": "content",
            "title": "8. UI/UX & GIS Mapping Engine",
            "bullets": [
                "Interactive Mapping: Custom Leaflet.js canvases using dark-matter/voyager tile schemes.",
                "Pulsing HTML divIcons: Color-coded map indicators matching the US AQI severity scale.",
                "Dual-City Compare: Parallel Chart.js forecast curves comparing two cities side-by-side.",
                "Responsive Grids: Fluid glassmorphism layouts with backdropped blurring effects."
            ]
        },
        # Slide 10: Conclusion & Next Steps
        {
            "type": "content",
            "title": "9. Conclusion & Project Deliverables",
            "bullets": [
                "Success: Successfully resolved key API redirects, unit scaling issues, and database persistence.",
                "Cloud Deployments: Deployed and live on Render at https://aeroquest-11v1.onrender.com.",
                "IoT Roadmap: Interfacing localized indoor smart-purifier metrics with regional warnings.",
                "AI Forecasting: Using historical datasets to predict next-day AQI trends based on wind directions."
            ]
        }
    ]
    
    # Generate Slides
    for data in slides_data:
        # Use blank layout
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        
        # Apply Deep Dark Background
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = DARK_BG
        
        # RENDER TITLE SLIDE
        if data["type"] == "title":
            title_box = slide.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.33), Inches(4.5))
            tf = title_box.text_frame
            tf.word_wrap = True
            
            p = tf.paragraphs[0]
            p.text = data["title"]
            p.font.name = "Outfit"
            p.font.size = Pt(64)
            p.font.bold = True
            p.font.color.rgb = WHITE
            p.alignment = PP_ALIGN.CENTER
            
            p2 = tf.add_paragraph()
            p2.text = data["subtitle"]
            p2.font.name = "Inter"
            p2.font.size = Pt(20)
            p2.font.color.rgb = EMERALD
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = Pt(15)
            
            p3 = tf.add_paragraph()
            p3.text = "Submitted by:"
            p3.font.name = "Inter"
            p3.font.size = Pt(14)
            p3.font.color.rgb = MUTED_GRAY
            p3.alignment = PP_ALIGN.CENTER
            p3.space_before = Pt(30)
            
            for s in data["students"]:
                ps = tf.add_paragraph()
                ps.text = s
                ps.font.name = "Inter"
                ps.font.size = Pt(14)
                ps.font.bold = True
                ps.font.color.rgb = WHITE
                ps.alignment = PP_ALIGN.CENTER
                ps.space_before = Pt(5)
            
        # RENDER CONTENT SLIDES
        else:
            # Add Title Box
            title_box = slide.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.33), Inches(1))
            tf_title = title_box.text_frame
            p_title = tf_title.paragraphs[0]
            p_title.text = data["title"]
            p_title.font.name = "Outfit"
            p_title.font.size = Pt(36)
            p_title.font.bold = True
            p_title.font.color.rgb = EMERALD
            
            # Add Content Bullet Box
            content_box = slide.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(11.33), Inches(4.5))
            tf_content = content_box.text_frame
            tf_content.word_wrap = True
            
            for idx, bullet in enumerate(data["bullets"]):
                p_bullet = tf_content.add_paragraph() if idx > 0 else tf_content.paragraphs[0]
                # Highlight PYTHON in bullets
                p_bullet.text = "•  " + bullet
                p_bullet.font.name = "Inter"
                p_bullet.font.size = Pt(20)
                p_bullet.font.color.rgb = WHITE
                p_bullet.space_after = Pt(16)
                p_bullet.level = 0
                
    # Save Presentation to Workspace
    filename = "AeroQuest_Presentation.pptx"
    prs.save(filename)
    print(f"Presentation saved successfully as {filename}")

if __name__ == '__main__':
    create_deck()
