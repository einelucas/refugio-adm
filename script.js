// Config do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBZva2fJCqsNx24pWlkmBAVAZetBFvO3Rc",
  authDomain: "refugio-das-flores-a9e11.firebaseapp.com",
  projectId: "refugio-das-flores-a9e11",
  storageBucket: "refugio-das-flores-a9e11.firebasestorage.app",
  messagingSenderId: "689639393299",
  appId: "1:689639393299:web:8f438802e7f3f8c86e97e6",
  measurementId: "G-Z545Q41PJM",
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
