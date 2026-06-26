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
    
    # Custom Color System (High-Tech Theme)
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
            "subtitle": "Advanced Full-Stack Dashboard for Global Atmospheric Analytics"
        },
        # Slide 2: Project Vision
        {
            "type": "content",
            "title": "1. Project Vision & Goals",
            "bullets": [
                "Democratize global atmospheric and air quality monitoring.",
                "Provide an out-of-the-box system that requires NO configuration or complex API key registrations.",
                "Fuse real-time meteorology (temperature, wind, humidity) with chemical pollutants concentrations.",
                "Bridge the gap between raw data formats and interactive visual user dashboards."
            ]
        },
        # Slide 3: Tech Stack
        {
            "type": "content",
            "title": "2. The Technical Stack",
            "bullets": [
                "Backend: Python 3.13 + Flask framework.",
                "Database Caching: SQLite3 (built-in relational database).",
                "Integrations: Open-Meteo REST APIs (Geocoding & Air Quality).",
                "Visualization: Chart.js (Interactive forecasting curves).",
                "Mapping: Leaflet.js (Interactive GIS maps with custom pulsing marker indicators)."
            ]
        },
        # Slide 4: Python Backend Logic
        {
            "type": "content",
            "title": "3. Python Server Logic (app.py)",
            "bullets": [
                "Route Proxying: Exposes custom endpoints like /api/air-quality to fetch raw payloads safely.",
                "CORS Mitigation: Prevents cross-origin file loading errors by proxying browser calls on the server.",
                "Error Handling: Traps exceptions during API fetches and returns user-friendly JSON payloads.",
                "Tuned Performance: Configured with debug=False for solid production execution in isolated sessions."
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
        # Slide 6: Visual Design System
        {
            "type": "content",
            "title": "5. UI/UX & Glassmorphism Design",
            "bullets": [
                "Modern Layout: Dark-mode by default with optional high-contrast Light Theme toggle.",
                "Glassmorphism: Utilizes backdrop-filter: blur() with subtle semitransparent borders.",
                "Dynamic Colors: Modifies CSS variables to color-match card glows to the active city's AQI severity.",
                "Fluid Responsiveness: Optimized layout grids for mobile, tablet, and widescreen monitors."
            ]
        },
        # Slide 7: GIS Leaflet Mapping
        {
            "type": "content",
            "title": "6. GIS Leaflet Mapping Engine",
            "bullets": [
                "Renders interactive maps using lightweight, CDN-hosted Leaflet.js.",
                "Features CARTO Voyager (light) and Dark Matter (dark) custom tile styling.",
                "Applies custom HTML divIcons that pulse with colors mapped to US AQI guidelines.",
                "Invalidates sizes on layout shifts to prevent grey layout rendering bugs."
            ]
        },
        # Slide 8: Interactive Charts & Analytics
        {
            "type": "content",
            "title": "7. Chart.js Forecast & Analytics",
            "bullets": [
                "Draws 7-day hourly analytics curves using modern HTML5 Canvas widgets.",
                "Filters: Interactive filters for PM2.5, PM10, Ozone, and Nitrogen Dioxide.",
                "Verdicts: Computes and displays peak values, lowest values, and average conditions.",
                "Dual-City Overlay: Graphs comparison curves side-by-side on a single comparison grid."
            ]
        },
        # Slide 9: Comparison Verdict Engine
        {
            "type": "content",
            "title": "8. Dual-City Comparison Engine",
            "bullets": [
                "Allows users to select any two cities dynamically (City A vs City B).",
                "Calculates clean air percentage verdicts: e.g. 'City A is 25% cleaner than City B'.",
                "Extracts comparative metrics (CO, SO2, O3, Dust) side-by-side.",
                "Fuses both datasets and renders dual-curves to compare forecasts at a glance."
            ]
        },
        # Slide 10: Future Roadmap
        {
            "type": "content",
            "title": "9. Conclusion & Next Steps",
            "bullets": [
                "IoT Integrations: Supporting localized smart air-purifier and home monitor APIs.",
                "Push Notifications: Alerting sensitive groups on sudden PM2.5 spikes.",
                "AI Forecasting: Machine learning layers to predict AQI spikes based on wind forecasts.",
                "Deployments: Containerizing the Flask server using Docker for cloud hosting."
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
            title_box = slide.shapes.add_textbox(Inches(1.5), Inches(2.2), Inches(10.33), Inches(3))
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
            p2.font.size = Pt(22)
            p2.font.color.rgb = EMERALD
            p2.alignment = PP_ALIGN.CENTER
            p2.space_before = Pt(20)
            
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
