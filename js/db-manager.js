// Firebase 데이터베이스 관리 클래스
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, onSnapshot, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

class DBManager {
    constructor() {
        this.db = null;
        this.allTools = [];
        this.popularTools = []; // 인기 도구만 별도 저장
        this.currentToolId = null;
        this.selectedCategories = new Set();
        this.currentSearchQuery = '';
        this.isInitialized = false;
        this.isLoading = false;
        this.error = null;
        this.realtimeListener = null;
        this.lazyLoadQueue = []; // 지연 로딩 큐
        this.isLazyLoading = false;
    }

    // 초기화 함수 - 최적화된 버전
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
            this.db = getFirestore(app);
            console.log('DBManager Firestore 초기화 완료');
            
            // 인기 도구만 우선 로드 (전체 도구는 지연 로딩)
            await this.loadPopularAITools(8, 4.5);
            
            this.isInitialized = true;
            window.dispatchEvent(new CustomEvent('dbManagerReady', { detail: { success: true } }));
            
            // 백그라운드에서 전체 도구 지연 로딩 시작
            this.startLazyLoading();
        } catch (error) {
            this.error = error;
            console.error('DBManager 초기화 실패:', error);
            window.dispatchEvent(new CustomEvent('dbManagerReady', { detail: { success: false, error: error.message } }));
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 최적화된 인기 AI 도구 로딩 함수
    async loadPopularAITools(limitParam = 8, minRating = 4.5) {
        try {
            if (!this.db) throw new Error('Firestore가 초기화되지 않았습니다.');
            this.isLoading = true;
            this.error = null;
            
            // 파라미터 안전성 검사 강화
            const safeLimit = typeof limitParam === 'number' && limitParam > 0 ? limitParam : 8;
            const safeMinRating = typeof minRating === 'number' && minRating >= 0 ? minRating : 4.5;
            
            console.log(`인기 AI 도구 로딩 시작 (최대 ${safeLimit}개, 최소 평점 ${safeMinRating})`);
            
            const toolsCol = collection(this.db, 'ai-tools');
            
            // 평점이 높은 도구들을 우선적으로 가져오기 위한 쿼리 최적화
            const highRatedQuery = query(
                toolsCol,
                where('rating', '>=', safeMinRating),
                orderBy('rating', 'desc'),
                limit(safeLimit * 2) // 필터링 후 충분한 수를 가져오기 위해 2배로
            );
            
            const querySnapshot = await getDocs(highRatedQuery);
            
            if (querySnapshot.empty) {
                console.log('평점이 높은 도구가 없습니다. 기본 쿼리로 대체합니다.');
                // 평점 필터가 실패하면 기본 쿼리로 대체
                const basicQuery = query(toolsCol, limit(safeLimit * 2));
                const basicSnapshot = await getDocs(basicQuery);
                return await this.processToolsFromSnapshot(basicSnapshot, safeLimit);
            }
            
            return await this.processToolsFromSnapshot(querySnapshot, safeLimit);
            
        } catch (error) {
            console.warn('인기 도구 쿼리 실패, 기본 쿼리로 대체:', error);
            // 에러 발생 시 기본 쿼리로 대체
            try {
                const toolsCol = collection(this.db, 'ai-tools');
                // limit 함수가 제대로 작동하지 않을 경우를 대비한 안전장치
                const safeLimit = typeof limitParam === 'number' && limitParam > 0 ? limitParam : 8;
                const basicQuery = query(toolsCol, limit(safeLimit));
                const basicSnapshot = await getDocs(basicQuery);
                return await this.processToolsFromSnapshot(basicSnapshot, safeLimit);
            } catch (fallbackError) {
                this.error = fallbackError;
                throw fallbackError;
            }
        } finally {
            this.isLoading = false;
        }
    }

    // 호환성을 위한 loadAITools 메서드 추가
    async loadAITools(limitParam = 50, minRating = 0) {
        try {
            console.log('loadAITools 호출됨 - loadPopularAITools로 대체');
            // 기존 코드와의 호환성을 위해 loadPopularAITools 사용
            return await this.loadPopularAITools(limitParam, minRating);
        } catch (error) {
            console.error('loadAITools 실행 실패:', error);
            throw error;
        }
    }

    // 스냅샷에서 도구 데이터 처리하는 헬퍼 함수
    async processToolsFromSnapshot(querySnapshot, limitParam) {
        const tools = [];
        const FIREBASE_LOGO_BASE = "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebaseapp.com/o/ai_logos%2F";
        
        // 병렬 처리를 위한 도구 데이터 수집
        const toolPromises = [];
        
        querySnapshot.forEach((docSnap) => {
            const tool = docSnap.data();
            tool.id = docSnap.id;
            
            // 기본 로고 URL 설정
            if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
            } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                tool.logoUrl = tool.imageUrl;
            } else {
                tool.logoUrl = null;
            }
            
            // 필수 데이터만 우선 설정, 상세 데이터는 지연 로딩
            toolPromises.push(this.processToolBasicData(tool));
        });
        
        // 병렬로 기본 데이터 처리
        const processedTools = await Promise.all(toolPromises);
        
        // 평점 순으로 정렬하고 limitParam만큼 반환
        const safeLimit = typeof limitParam === 'number' && limitParam > 0 ? limitParam : 8;
        const sortedTools = processedTools
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, safeLimit);
        
        this.popularTools = sortedTools;
        console.log(`인기 AI 도구 ${sortedTools.length}개 로딩 완료`);
        
        return sortedTools;
    }

    // 도구의 기본 데이터만 처리하는 함수 (성능 최적화)
    async processToolBasicData(tool) {
        // 기본 필드만 설정, 상세 데이터는 지연 로딩
        return {
            id: tool.id,
            name: tool.name || '',
            description: tool.description || tool.shortDescription || '',
            rating: tool.rating || 0,
            logoUrl: tool.logoUrl,
            logoFileName: tool.logoFileName,
            imageUrl: tool.imageUrl,
            category: tool.category || '',
            tags: tool.tags || [],
            pricing: tool.pricing || [],
            // 상세 데이터는 나중에 필요할 때 로드
            longDescription: null,
            detailedPricing: null
        };
    }

    // 지연 로딩 시작
    startLazyLoading() {
        if (this.isLazyLoading) return;
        
        this.isLazyLoading = true;
        console.log('백그라운드 지연 로딩 시작');
        
        // 사용자 인터랙션이 없을 때 백그라운드에서 전체 도구 로드
        setTimeout(() => {
            this.loadAllToolsInBackground();
        }, 3000); // 3초 후 시작
    }

    // 백그라운드에서 전체 도구 로드
    async loadAllToolsInBackground() {
        try {
            console.log('백그라운드에서 전체 AI 도구 로딩 시작');
            const toolsCol = collection(this.db, 'ai-tools');
            const querySnapshot = await getDocs(toolsCol);
            
            const allTools = [];
            const FIREBASE_LOGO_BASE = "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebaseapp.com/o/ai_logos%2F";
            
            // 기본 데이터만 우선 처리
            querySnapshot.forEach((docSnap) => {
                const tool = docSnap.data();
                tool.id = docSnap.id;
                
                if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                    tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
                } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                    tool.logoUrl = tool.imageUrl;
                } else {
                    tool.logoUrl = null;
                }
                
                allTools.push(this.processToolBasicData(tool));
            });
            
            this.allTools = allTools;
            console.log(`백그라운드에서 전체 AI 도구 ${allTools.length}개 로딩 완료`);
            
            // 전체 도구 로드 완료 이벤트 발생
            window.dispatchEvent(new CustomEvent('allToolsLoaded', { detail: { count: allTools.length } }));
            
        } catch (error) {
            console.warn('백그라운드 전체 도구 로딩 실패:', error);
        } finally {
            this.isLazyLoading = false;
        }
    }

    // 필요할 때 도구 상세 정보 로드 (지연 로딩)
    async loadToolDetails(toolId) {
        try {
            if (!this.db) throw new Error('Firestore가 초기화되지 않았습니다.');
            
            const toolRef = doc(this.db, 'ai-tools', toolId);
            const toolSnap = await getDoc(toolRef);
            
            if (!toolSnap.exists()) {
                throw new Error('도구를 찾을 수 없습니다.');
            }
            
            const tool = toolSnap.data();
            tool.id = toolSnap.id;
            
            // 로고 URL 설정
            const FIREBASE_LOGO_BASE = "https://firebasestorage.googleapis.com/v0/b/ai-tools-data-b2b7b.firebaseapp.com/o/ai_logos%2F";
            if (tool.logoFileName && typeof tool.logoFileName === 'string' && tool.logoFileName.trim() !== '') {
                tool.logoUrl = FIREBASE_LOGO_BASE + encodeURIComponent(tool.logoFileName) + "?alt=media";
            } else if (tool.imageUrl && typeof tool.imageUrl === 'string' && tool.imageUrl.trim() !== '') {
                tool.logoUrl = tool.imageUrl;
            } else {
                tool.logoUrl = null;
            }
            
            // 상세 정보 병렬 로드
            const [summaryData, pricingData] = await Promise.all([
                this.loadToolSummary(toolId),
                this.loadToolPricing(toolId)
            ]);
            
            tool.longDescription = summaryData.longDescription || '';
            tool.detailedPricing = pricingData;
            
            return tool;
            
        } catch (error) {
            this.error = error;
            throw error;
        }
    }

    // 도구 요약 정보 로드
    async loadToolSummary(toolId) {
        try {
            const summaryRef = doc(this.db, 'ai-tools', toolId, 'overview', 'summary');
            const summarySnap = await getDoc(summaryRef);
            return summarySnap.exists() ? summarySnap.data() : { longDescription: '' };
        } catch (error) {
            console.warn(`도구 ${toolId} 요약 정보 로드 실패:`, error);
            return { longDescription: '' };
        }
    }

    // 도구 가격 정보 로드
    async loadToolPricing(toolId) {
        try {
            const pricingCol = collection(this.db, 'ai-tools', toolId, 'pricing');
            const pricingSnap = await getDocs(pricingCol);
            const pricing = [];
            pricingSnap.forEach((planDoc) => {
                pricing.push(planDoc.data());
            });
            return pricing;
        } catch (error) {
            console.warn(`도구 ${toolId} 가격 정보 로드 실패:`, error);
            return [];
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

    // 도구 저장하기 (Firestore)
    async saveTool(userId, toolId) {
        try {
            this.isLoading = true;
            this.error = null;
            const savedDocRef = doc(this.db, 'users', userId, 'savedTools', toolId);
            await setDoc(savedDocRef, { savedAt: new Date().toISOString() }, { merge: true });
            return true;
        } catch (error) {
            this.error = error;
            console.error('도구 저장 중 오류:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    // 저장된 도구 목록 가져오기 (Firestore)
    async getSavedTools(userId) {
        try {
            this.isLoading = true;
            this.error = null;
            const savedColRef = collection(this.db, 'users', userId, 'savedTools');
            const savedSnap = await getDocs(savedColRef);
            if (savedSnap.empty) return [];

            const savedTools = [];
            const promises = [];
            savedSnap.forEach((docSnap) => {
                const toolId = docSnap.id;
                const savedAt = (docSnap.data() || {}).savedAt;
                const p = this.getToolDetails(toolId).then((toolDetails) => {
                    if (toolDetails) {
                        savedTools.push({ ...toolDetails, savedAt });
                    }
                });
                promises.push(p);
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

// 하위 호환성을 위한 전역 함수 등록
window.loadPopularAITools = (limitParam = 8, minRating = 4.5) => {
    if (window.dbManager && window.dbManager.isInitialized) {
        return window.dbManager.loadPopularAITools(limitParam, minRating);
    } else {
        throw new Error('DBManager가 아직 초기화되지 않았습니다.');
    }
};

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