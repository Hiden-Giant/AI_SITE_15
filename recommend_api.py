from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

app = Flask(__name__)

# AI 도구 데이터 불러오기
with open("AI_TOOLS_36.json", "r", encoding="utf-8") as f:
    tools = json.load(f)

tool_texts = [f"{t['description']} {' '.join(t['tags'])} {t['primaryCategory']}" for t in tools]
tool_names = [t['name'] for t in tools]

@app.route("/recommend", methods=["POST"])
def recommend():
    user_input = request.json.get("text", "")
    user_keywords = " ".join([word for word in user_input.split() if len(word) > 1])
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(tool_texts + [user_keywords])
    cosine_sim = cosine_similarity(tfidf_matrix[-1], tfidf_matrix[:-1])
    top_indices = cosine_sim[0].argsort()[::-1][:5]
    
    results = [{"tool": tool_names[i], "score": round(float(cosine_sim[0][i]), 3)} for i in top_indices]
    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
