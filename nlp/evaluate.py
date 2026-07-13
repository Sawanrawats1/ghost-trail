from freshness import analyze_comment

# Test dataset — 30 labeled comments (expanded for better coverage)
test_data = [
    # --- NEEDS REVIEW (clear hazards) ---
    ("trail was completely overgrown and washed out", "needs_review"),
    ("path is blocked by fallen tree", "needs_review"),
    ("dangerous landslide near the crossing", "needs_review"),
    ("flooded river, couldn't cross", "needs_review"),
    ("path gone, no longer visible", "needs_review"),
    ("trail collapsed near waypoint 2", "needs_review"),
    ("road blocked by construction, avoid this route", "needs_review"),
    ("got lost, path has completely disappeared", "needs_review"),
    ("unsafe crossing, bridge is broken", "needs_review"),
    ("fire reported near trail, do not enter", "needs_review"),

    # --- CAUTION (minor issues) ---
    ("some mud on path, bit slippery", "caution"),
    ("one fallen branch on trail", "caution"),
    ("path unclear at the fork", "caution"),
    ("slightly overgrown but manageable", "caution"),
    ("path exists but needs clearing", "caution"),
    ("warning: steep section near top", "caution"),
    ("trail is a bit hard to find after the bridge", "caution"),
    ("some overgrowth but still passable", "caution"),
    ("slippery rocks near the waterfall area", "caution"),
    ("faint path, follow carefully", "caution"),

    # --- CLEAR (good condition) ---
    ("beautiful trail, clear path", "clear"),
    ("visited today, still accessible", "clear"),
    ("well marked and easy to follow", "clear"),
    ("perfect condition, highly recommend", "clear"),
    ("amazing place, path is visible", "clear"),
    ("great experience, safe trail", "clear"),
    ("stunning waterfall, easy hike", "clear"),
    ("confirmed working trail", "clear"),
    ("path is clear and well defined", "clear"),
    ("visited this morning, excellent condition", "clear"),
]

correct = 0
total = len(test_data)
results_by_class = {"needs_review": {"correct": 0, "total": 0},
                    "caution": {"correct": 0, "total": 0},
                    "clear": {"correct": 0, "total": 0}}

print("\n=== Ghost Trail NLP Evaluation v2 ===")
print(f"Model: hybrid_keyword_sentiment_v2")
print(f"Test samples: {total}\n")

for comment, expected in test_data:
    result = analyze_comment(comment)
    predicted = result['risk']
    sentiment = result['sentiment_score']
    hazards = result['hazard_keywords_found']

    status = "✓" if predicted == expected else "✗"
    if predicted == expected:
        correct += 1
        results_by_class[expected]["correct"] += 1
    results_by_class[expected]["total"] += 1

    print(f"{status} [{expected:12}] → [{predicted:12}] | sentiment={sentiment:+.2f} | hazards={hazards} | '{comment[:40]}...'")

accuracy = (correct / total) * 100

print(f"\n=== Results ===")
print(f"Overall Accuracy : {correct}/{total} = {accuracy:.1f}%")
print()
for cls, data in results_by_class.items():
    cls_acc = (data['correct'] / data['total'] * 100) if data['total'] > 0 else 0
    print(f"  {cls:15} : {data['correct']}/{data['total']} = {cls_acc:.0f}%")

print()
if accuracy >= 90:
    print("✓ Excellent — model is performing very well")
elif accuracy >= 80:
    print("✓ Good — model is performing well for a domain-specific classifier")
elif accuracy >= 70:
    print("⚡ Acceptable — consider expanding the keyword lexicon")
else:
    print("✗ Needs improvement — review keyword lexicon and thresholds")

print(f"\nConclusion: The hybrid keyword-sentiment model achieves {accuracy:.1f}% accuracy")
print("on a 30-sample domain-specific trail safety dataset.")