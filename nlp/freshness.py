from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Hazard keywords — Approach A (rule-based NLP)
HAZARD_KEYWORDS = [
    "overgrown", "washed out", "landslide", "fallen tree", "blocked",
    "can't find", "cannot find", "couldn't find", "no longer visible",
    "flooded", "collapsed", "dangerous", "closed", "construction",
    "path gone", "trail gone", "not there", "disappeared", "wrong path",
    "got lost", "slippery", "broken bridge", "road blocked", "fire",
    "warning", "avoid", "unsafe", "hazard", "weed", "mud", "flood"
]

POSITIVE_KEYWORDS = [
    "beautiful", "amazing", "clear", "perfect", "great path",
    "easy to follow", "well marked", "confirmed", "still there",
    "visited today", "fresh", "good condition", "accessible"
]

def analyze_comment(text):
    text_lower = text.lower()
    
    hazard_hits = [kw for kw in HAZARD_KEYWORDS if kw in text_lower]
    positive_hits = [kw for kw in POSITIVE_KEYWORDS if kw in text_lower]
    
    if len(hazard_hits) >= 2:
        risk = "needs_review"
        confidence = min(0.95, 0.6 + len(hazard_hits) * 0.1)
    elif len(hazard_hits) == 1:
        risk = "caution"
        confidence = 0.65
    elif positive_hits:
        risk = "clear"
        confidence = min(0.95, 0.7 + len(positive_hits) * 0.05)
    else:
        risk = "clear"
        confidence = 0.5
    
    return {
        "risk": risk,
        "confidence": round(confidence, 2),
        "hazard_keywords_found": hazard_hits,
        "positive_keywords_found": positive_hits,
        "comment_analyzed": text
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if not data or 'comment' not in data:
        return jsonify({"error": "No comment provided"}), 400
    
    result = analyze_comment(data['comment'])
    return jsonify(result)

@app.route('/analyze-multiple', methods=['POST'])
def analyze_multiple():
    data = request.get_json()
    if not data or 'comments' not in data:
        return jsonify({"error": "No comments provided"}), 400
    
    results = [analyze_comment(c) for c in data['comments']]
    
    # Overall trail risk = worst single comment risk
    risk_levels = {"clear": 0, "caution": 1, "needs_review": 2}
    worst = max(results, key=lambda x: risk_levels.get(x["risk"], 0))
    
    return jsonify({
        "overall_risk": worst["risk"],
        "individual_results": results
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "NLP service running", "version": "1.0"})

if __name__ == '__main__':
    app.run(port=5001, debug=True)