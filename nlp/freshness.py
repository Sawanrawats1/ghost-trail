from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob

app = Flask(__name__)
CORS(app)

# ============================================================
# Hazard keywords — domain-specific trail lexicon (v3, severity-tiered)
# ============================================================
# HIGH severity: structural / dangerous conditions.
# Presence of ANY high-severity keyword = needs_review, regardless
# of sentiment. A collapsed bridge is a collapsed bridge whether the
# reporter sounds calm or not.
HIGH_SEVERITY_KEYWORDS = [
    "washed out", "landslide", "fallen tree", "blocked", "flooded",
    "collapsed", "dangerous", "closed", "construction", "path gone",
    "trail gone", "not there", "disappeared", "wrong path", "got lost",
    "broken bridge", "road blocked", "fire", "warning", "avoid",
    "unsafe", "hazard", "rockfall", "unstable", "eroded", "damaged",
    "missing", "can't find", "cannot find", "couldn't find",
    "no longer visible", "bridge is broken", "do not enter",
    "washed away", "path disappeared", "trail disappeared",
    "completely blocked", "inaccessible", "no path", "lost the trail",
    "couldn't follow", "misleading", "wrong direction"
]

# LOW severity: minor / cosmetic annoyances that don't block passage
# on their own. These should only escalate to needs_review when
# stacked together AND paired with genuinely negative sentiment.
LOW_SEVERITY_KEYWORDS = [
    "overgrown", "slippery", "weed", "mud", "steep", "confusing",
    "unclear", "overgrown path", "dense jungle", "fallen branch",
    "needs clearing", "steep section", "hard to find",
    "difficult to find", "barely visible", "faint path",
    "hard to follow", "overgrowth"
]

POSITIVE_KEYWORDS = [
    "beautiful", "amazing", "clear", "perfect", "great path",
    "easy to follow", "well marked", "confirmed", "still there",
    "visited today", "fresh", "good condition", "accessible",
    "safe", "wonderful", "excellent", "recommend", "visible",
    "clear path", "well defined", "easy", "smooth",
    "passable", "manageable", "doable", "still accessible",
    "path exists", "trail exists", "clearly marked", "no issues",
    "great condition", "highly recommend", "easy to navigate"
]


def get_risk_level(high_hazard_count, low_hazard_count, sentiment_score, positive_count):
    """
    Hybrid model v3: severity-tiered keyword lexicon + TextBlob sentiment

    Rules:
    - Any HIGH-severity keyword -> needs_review, regardless of sentiment
      (structural/dangerous conditions aren't negotiable via tone)
    - 2+ LOW-severity keywords + negative sentiment -> needs_review
      (multiple minor issues stacking up, reporter also unhappy)
    - 1 LOW-severity keyword + strongly negative sentiment (<-0.35) -> needs_review
    - Any LOW-severity keyword, or mildly negative sentiment -> caution
    - Positive keywords + non-negative sentiment -> clear
    """
    if high_hazard_count >= 1:
        return "needs_review"
    if low_hazard_count >= 2 and sentiment_score < -0.2:
        return "needs_review"
    if low_hazard_count >= 1 and sentiment_score < -0.35:
        return "needs_review"
    if low_hazard_count >= 1 or sentiment_score < -0.15:
        return "caution"
    if positive_count >= 1 or sentiment_score >= 0:
        return "clear"
    return "clear"


def get_confidence(risk, high_hazard_count, low_hazard_count, sentiment_score, positive_count):
    """
    Confidence is higher when keyword severity and sentiment signals agree
    """
    if risk == "needs_review":
        base = 0.70
        if high_hazard_count >= 1: base += 0.12
        if low_hazard_count >= 2: base += 0.05
        if sentiment_score < -0.3: base += 0.08
        return min(round(base, 2), 0.95)

    if risk == "caution":
        base = 0.60
        if low_hazard_count >= 1 and sentiment_score < 0: base += 0.10
        if sentiment_score < -0.15: base += 0.05
        return min(round(base, 2), 0.85)

    # clear
    base = 0.55
    if positive_count >= 1: base += 0.10
    if sentiment_score > 0.2: base += 0.10
    if positive_count >= 2: base += 0.05
    return min(round(base, 2), 0.92)


def analyze_comment(text):
    text_lower = text.lower()

    # Layer 1 — domain keyword detection (severity-tiered)
    high_hits = [kw for kw in HIGH_SEVERITY_KEYWORDS if kw in text_lower]
    low_hits = [kw for kw in LOW_SEVERITY_KEYWORDS if kw in text_lower]
    positive_hits = [kw for kw in POSITIVE_KEYWORDS if kw in text_lower]

    # Layer 2 — TextBlob sentiment analysis (pretrained Naive Bayes)
    blob = TextBlob(text)
    sentiment_score = round(blob.sentiment.polarity, 3)
    subjectivity_score = round(blob.sentiment.subjectivity, 3)

    # Hybrid decision combining both layers
    risk = get_risk_level(len(high_hits), len(low_hits), sentiment_score, len(positive_hits))
    confidence = get_confidence(risk, len(high_hits), len(low_hits), sentiment_score, len(positive_hits))

    return {
        "risk": risk,
        "confidence": confidence,
        "sentiment_score": sentiment_score,
        "subjectivity_score": subjectivity_score,
        "sentiment_label": (
            "negative" if sentiment_score < -0.1
            else "positive" if sentiment_score > 0.1
            else "neutral"
        ),
        "hazard_keywords_found": high_hits + low_hits,
        "high_severity_keywords_found": high_hits,
        "low_severity_keywords_found": low_hits,
        "positive_keywords_found": positive_hits,
        "comment_analyzed": text,
        "model": "hybrid_keyword_sentiment_v3"
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
    risk_levels = {"clear": 0, "caution": 1, "needs_review": 2}
    worst = max(results, key=lambda x: risk_levels.get(x["risk"], 0))

    return jsonify({
        "overall_risk": worst["risk"],
        "overall_sentiment": round(
            sum(r["sentiment_score"] for r in results) / len(results), 3
        ),
        "individual_results": results
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "NLP service running",
        "version": "3.0",
        "model": "hybrid_keyword_sentiment_v3",
        "libraries": ["textblob", "keyword_lexicon"],
        "high_severity_keywords_count": len(HIGH_SEVERITY_KEYWORDS),
        "low_severity_keywords_count": len(LOW_SEVERITY_KEYWORDS),
        "positive_keywords_count": len(POSITIVE_KEYWORDS)
    })


if __name__ == '__main__':
    app.run(port=5001, debug=True)