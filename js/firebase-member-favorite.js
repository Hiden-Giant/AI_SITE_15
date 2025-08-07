function initMemberAndFavoriteTracking() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            var uid = user.uid;
            var memberRef = firebase.database().ref('ai-tools-data-member/' + uid);

            memberRef.once('value').then(function(snapshot) {
                if (!snapshot.exists()) {
                    var cust_no = Date.now();
                    var email = user.email;

                    memberRef.set({
                        uid: uid,
                        email: email,
                        cust_no: cust_no,
                        created_at: new Date().toISOString()
                    }).then(function() {
                        console.log("회원 정보 등록 완료:", uid);
                    }).catch(function(error) {
                        console.error("회원 정보 등록 오류:", error);
                    });
                }
            });
        }
    });
}

function saveFavoriteTool(toolId) {
    var user = firebase.auth().currentUser;

    if (!user) {
        alert("로그인이 필요합니다.");
        return;
    }

    var uid = user.uid;
    var favRef = firebase.database().ref('ai-tools-data-favorites/' + uid + '/favorite_sites');
    favRef.push(toolId).then(function() {
        console.log("즐겨찾기 저장 완료:", toolId);
    }).catch(function(error) {
        console.error("즐겨찾기 저장 실패:", error);
    });
}

window.initMemberAndFavoriteTracking = initMemberAndFavoriteTracking;
window.saveFavoriteTool = saveFavoriteTool;

