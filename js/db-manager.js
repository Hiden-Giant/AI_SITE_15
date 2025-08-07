// Firebase 데이터베이스 관리 클래스
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

class DBManager {
    constructor() {
        this.db = null;
        this.allTools = [];
        this.currentToolId = null;
        this.selectedCategories = new Set();
        this.currentSearchQuery = '';
        this.isInitialized = false;
        this.isLoading = false;
        this.error = null;
        this.realtimeListener = null;
    }

    // 초기화 함수
    async init(app) {
        try {
            if (this.isInitialized) {
                console.log('DBManager가 이미 초기화되었습니다.');
                return;
            }
            if (!app) {
                throw new Error('Firebase 앱 객체가 제공되지 않았습니다.');
            }
            this.isLoading = true;
            this.error = null;
            this.db = getFirestore(app); // Firestore 객체로 변경
            console.log('DBManager Firestore 초기화 완료');
            await this.loadAITools();
            this.isInitialized = true;
            window.dispatchEvent(new CustomEvent('dbManagerReady', { detail: { success: true } }));
        } catch (error) {
            this.error = error;
            console.error('DBManager 초기화 실패:', error);
            window.dispatchEvent(new CustomEvent('dbManagerReady', { detail: { success: false, error: error.message } }));
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // AI 도구 로드 함수
    async loadAITools() {
        try {
            if (!this.db) {
                throw new Error('Firestore가 초기화되지 않았습니다.');
            }
            this.isLoading = true;
            this.error = null;
            console.log("AI 도구 Firestore에서 로드 시작");

            const toolsCol = collection(this.db, 'ai-tools');
            const querySnapshot = await getDocs(toolsCol);

            this.allTools = [];
            const FIREBASE_LOGO_BASE =
  "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebasestorage.app/o/ai_logos%2F";
            // 각 도구별 summary/summary, pricing 서브컬렉션을 병렬로 불러오기
            const toolPromises = [];
            querySnapshot.forEach((docSnap) => {
                const tool = docSnap.data();
                tool.id = docSnap.id;
                // logoFileName 우선 적용 (Storage URL 변환)
                if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                    tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
                } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                    tool.logoUrl = tool.imageUrl;
                } else {
                    tool.logoUrl = null;
                }
                // summary/summary와 pricing 서브컬렉션을 비동기로 읽어 tool에 추가
                toolPromises.push((async () => {
                    // summary/summary 문서 읽기
                    try {
                        const summaryRef = doc(this.db, 'ai-tools', tool.id, 'overview', 'summary');
                        const summarySnap = await getDoc(summaryRef);
                        if (summarySnap.exists()) {
                            const summaryData = summarySnap.data();
                            tool.longDescription = summaryData.longDescription || '';
                            // tool.tagsKr = summaryData.tagsKr || []; // 제거: 도구 루트의 tagsKr만 사용
                        } else {
                            tool.longDescription = '';
                        }
                    } catch (e) {
                        tool.longDescription = '';
                    }
                    // pricing 서브컬렉션 읽기
                    try {
                        const pricingCol = collection(this.db, 'ai-tools', tool.id, 'pricing');
                        const pricingSnap = await getDocs(pricingCol);
                        tool.pricing = [];
                        pricingSnap.forEach((planDoc) => {
                            tool.pricing.push(planDoc.data());
                        });
                    } catch (e) {
                        tool.pricing = [];
                    }
                    return tool;
                })());
            });
            this.allTools = await Promise.all(toolPromises);
            console.log("로드된 도구 수:", this.allTools.length);
            return this.allTools;
        } catch (error) {
            this.error = error;
            console.error("AI 도구 Firestore 로드 중 오류:", error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 인기 AI 도구만 불러오는 함수
    async loadPopularAITools(limit = 6, minRating = 4.7) {
        try {
            if (!this.db) throw new Error('Firestore가 초기화되지 않았습니다.');
            this.isLoading = true;
            this.error = null;
            const toolsCol = collection(this.db, 'ai-tools');
            const querySnapshot = await getDocs(toolsCol);

            let tools = [];
            const FIREBASE_LOGO_BASE = "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebasestorage.app/o/ai_logos%2F";
            const toolPromises = [];
            querySnapshot.forEach((docSnap) => {
                const tool = docSnap.data();
                tool.id = docSnap.id;
                // logoFileName 우선 적용 (Storage URL 변환)
                if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                    tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
                } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                    tool.logoUrl = tool.imageUrl;
                } else {
                    tool.logoUrl = null;
                }
                toolPromises.push((async () => {
                    // summary/summary 문서 읽기
                    try {
                        const summaryRef = doc(this.db, 'ai-tools', tool.id, 'overview', 'summary');
                        const summarySnap = await getDoc(summaryRef);
                        if (summarySnap.exists()) {
                            const summaryData = summarySnap.data();
                            tool.longDescription = summaryData.longDescription || '';
                        } else {
                            tool.longDescription = '';
                        }
                    } catch (e) {
                        tool.longDescription = '';
                    }
                    // pricing 서브컬렉션 읽기
                    try {
                        const pricingCol = collection(this.db, 'ai-tools', tool.id, 'pricing');
                        const pricingSnap = await getDocs(pricingCol);
                        tool.pricing = [];
                        pricingSnap.forEach((planDoc) => {
                            tool.pricing.push(planDoc.data());
                        });
                    } catch (e) {
                        tool.pricing = [];
                    }
                    return tool;
                })());
            });
            tools = await Promise.all(toolPromises);
            // 평점 필터 및 랜덤 6개 추출
            const highRated = tools.filter(t => (t.rating || 0) >= minRating);
            // 랜덤 섞기
            for (let i = highRated.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [highRated[i], highRated[j]] = [highRated[j], highRated[i]];
            }
            this.allTools = highRated.slice(0, limit);
            return this.allTools;
        } catch (error) {
            this.error = error;
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 실시간 업데이트 설정 (Firestore용)
    setupRealtimeUpdates(callback) {
        try {
            this.cleanupRealtimeUpdates();
            const toolsCol = collection(this.db, 'ai-tools');
            this.realtimeListener = onSnapshot(toolsCol, async (querySnapshot) => {
                // summary/summary, pricing 서브컬렉션까지 병렬로 불러오기
                const toolPromises = [];
                querySnapshot.forEach((docSnap) => {
                    const tool = docSnap.data();
                    tool.id = docSnap.id;
                    // logoFileName 우선 적용 (Storage URL 변환)
                    const FIREBASE_LOGO_BASE =
  "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebasestorage.app/o/ai_logos%2F";
                    if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                        tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
                    } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                        tool.logoUrl = tool.imageUrl;
                    } else {
                        tool.logoUrl = null;
                    }
                    toolPromises.push((async () => {
                        // summary/summary 문서 읽기
                        try {
                            const summaryRef = doc(this.db, 'ai-tools', tool.id, 'overview', 'summary');
                            const summarySnap = await getDoc(summaryRef);
                            if (summarySnap.exists()) {
                                const summaryData = summarySnap.data();
                                tool.longDescription = summaryData.longDescription || '';
                                // tool.tagsKr = summaryData.tagsKr || []; // 제거: 도구 루트의 tagsKr만 사용
                            } else {
                                tool.longDescription = '';
                            }
                        } catch (e) {
                            tool.longDescription = '';
                        }
                        // pricing 서브컬렉션 읽기
                        try {
                            const pricingCol = collection(this.db, 'ai-tools', tool.id, 'pricing');
                            const pricingSnap = await getDocs(pricingCol);
                            tool.pricing = [];
                            pricingSnap.forEach((planDoc) => {
                                tool.pricing.push(planDoc.data());
                            });
                        } catch (e) {
                            tool.pricing = [];
                        }
                        return tool;
                    })());
                });
                this.allTools = await Promise.all(toolPromises);
                if (callback && typeof callback === 'function') {
                    callback(this.allTools);
                }
            }, (error) => {
                this.error = error;
                console.error('실시간 데이터 구독 오류:', error);
                window.dispatchEvent(new CustomEvent('dbManagerError', { detail: { error: error.message } }));
            });
        } catch (error) {
            this.error = error;
            console.error('실시간 업데이트 설정 중 오류:', error);
            throw error;
        }
    }

    // 실시간 업데이트 정리 (Firestore용)
    cleanupRealtimeUpdates() {
        if (this.realtimeListener) {
            this.realtimeListener(); // Firestore에서는 함수 호출로 구독 해제
            this.realtimeListener = null;
        }
    }

    // 도구 상세 정보 가져오기 (Firestore용)
    async getToolDetails(toolId) {
        try {
            this.isLoading = true;
            this.error = null;
            const toolRef = doc(this.db, 'ai-tools', toolId);
            const docSnap = await getDoc(toolRef);
            if (!docSnap.exists()) return null;
            const tool = docSnap.data();
            tool.id = docSnap.id;

            // logoFileName 우선 적용 (Storage URL 변환)
            if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                const FIREBASE_LOGO_BASE =
  "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebasestorage.app/o/ai_logos%2F";
                tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
            } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                tool.logoUrl = tool.imageUrl;
            } else {
                tool.logoUrl = null;
            }

            // summary 서브컬렉션 (summary/summary 문서)
            try {
                const summaryPath = `ai-tools/${toolId}/summary/summary`;
                console.log('summaryRef 경로:', summaryPath);
                const summaryRef = doc(this.db, 'ai-tools', toolId, 'overview', 'summary');
                const summarySnap = await getDoc(summaryRef);
                if (summarySnap.exists()) {
                    tool.summary = summarySnap.data();
                    console.log('summarySnap 데이터:', tool.summary);
                } else {
                    tool.summary = null;
                    console.log('summary 문서 없음:', toolId);
                }
            } catch (e) {
                tool.summary = null;
                console.error('summary 읽기 에러:', e);
            }

            // pricing 서브컬렉션 (여러 문서)
            try {
                const pricingPath = `ai-tools/${toolId}/pricing`;
                console.log('pricingCol 경로:', pricingPath);
                const pricingCol = collection(this.db, 'ai-tools', toolId, 'pricing');
                const pricingSnap = await getDocs(pricingCol);
                tool.pricing = [];
                pricingSnap.forEach((planDoc) => {
                    tool.pricing.push(planDoc.data());
                });
                console.log('pricingSnap 데이터:', tool.pricing);
                if (tool.pricing.length === 0) {
                    console.log('pricing 문서 없음:', toolId);
                }
            } catch (e) {
                tool.pricing = [];
                console.error('pricing 읽기 에러:', e);
            }

            // reviews 서브컬렉션 (이미 구현됨)
            const reviewsCol = collection(this.db, 'ai-tools', toolId, 'reviews');
            const reviewsSnap = await getDocs(reviewsCol);
            tool.reviews = [];
            reviewsSnap.forEach((reviewDoc) => {
                const reviewData = reviewDoc.data();
                reviewData.id = reviewDoc.id;
                tool.reviews.push(reviewData);
            });

            return tool;
        } catch (error) {
            this.error = error;
            console.error('도구 상세 정보 Firestore 로드 중 오류:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 도구 필터링 함수
    filterTools(searchQuery = '', categories = new Set()) {
        let filteredTools = [...this.allTools];

        // 검색어로 필터링
        if (searchQuery) {
            filteredTools = filteredTools.filter(tool => {
                const searchFields = [
                    tool.name,
                    tool.description,
                    tool.longDescription,
                    ...(tool.tags || []),
                    tool.primaryCategory,
                    ...(tool.categories || [])
                ].map(field => (field || '').toLowerCase());
                
                const searchTerms = searchQuery.toLowerCase().split(' ');
                return searchTerms.every(term => 
                    searchFields.some(field => field.includes(term))
                );
            });
        }

        // 카테고리로 필터링
        if (categories.size > 0) {
            filteredTools = filteredTools.filter(tool => {
                const toolCategories = [
                    tool.primaryCategory,
                    ...(tool.categories || [])
                ].filter(Boolean);
                
                return Array.from(categories).every(selectedCategory => 
                    toolCategories.includes(selectedCategory)
                );
            });
        }

        return filteredTools;
    }

    // 도구 저장하기
    async saveTool(userId, toolId) {
        try {
            this.isLoading = true;
            this.error = null;
            const userSavedRef = ref(this.db, `users/${userId}/savedTools/${toolId}`);
            await set(userSavedRef, {
                savedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            this.error = error;
            console.error('도구 저장 중 오류:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 저장된 도구 목록 가져오기
    async getSavedTools(userId) {
        try {
            this.isLoading = true;
            this.error = null;
            const userSavedRef = ref(this.db, `users/${userId}/savedTools`);
            const snapshot = await get(userSavedRef);
            
            if (!snapshot.exists()) {
                return [];
            }

            const savedTools = [];
            const promises = [];

            snapshot.forEach((childSnapshot) => {
                const toolId = childSnapshot.key;
                const promise = this.getToolDetails(toolId).then(toolDetails => {
                    if (toolDetails) {
                        savedTools.push({
                            ...toolDetails,
                            savedAt: childSnapshot.val().savedAt
                        });
                    }
                });
                promises.push(promise);
            });

            await Promise.all(promises);
            return savedTools;

        } catch (error) {
            this.error = error;
            console.error('저장된 도구 목록 로드 중 오류:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 현재 상태 가져오기
    getState() {
        return {
            isLoading: this.isLoading,
            error: this.error,
            isInitialized: this.isInitialized,
            toolsCount: this.allTools.length
        };
    }
}

// 전역 인스턴스 생성
const dbManager = new DBManager();
window.dbManager = dbManager; // 이 줄 다시 추가!
export { dbManager };

// Firebase 초기화 완료 이벤트 리스너 (app 객체 사용)
window.addEventListener('firebaseInitialized', (event) => {
    const { app } = event.detail;
    if (app) {
        window.dbManager.init(app).catch(error => {
            console.error('DBManager 초기화 실패:', error);
            window.dispatchEvent(new CustomEvent('dbManagerError', {
                detail: { error: error.message }
            }));
        });
    } else {
        console.error('Firebase 초기화 이벤트에 app이 없습니다.');
        window.dispatchEvent(new CustomEvent('dbManagerError', {
            detail: { error: 'Firestore 초기화 실패' }
        }));
    }
}); 