export default function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET 요청이 아닌 경우 처리
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Vercel 환경변수에서 Firebase 설정 가져오기
        const firebaseConfig = {
            apiKey: process.env.VITE_FIREBASE_API_KEY,
            authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
            projectId: process.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.VITE_FIREBASE_APP_ID
        };

        // 필수 설정값이 없는 경우 에러 처리
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
        const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
        }

        // 설정 반환
        res.status(200).json(firebaseConfig);
    } catch (error) {
        console.error('Firebase config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 