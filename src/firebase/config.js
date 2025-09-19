// 🔥 Configuração Firebase - Realtime Database
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// 🔧 Configuração oficial conforme console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBSzkFhPmC97fb0xwtNl6rQ_ll9B3vrTTc",
  authDomain: "barcebanco.firebaseapp.com",
  databaseURL: "https://barcebanco-default-rtdb.firebaseio.com",
  projectId: "barcebanco",
  storageBucket: "barcebanco.firebasestorage.app",
  messagingSenderId: "1096519487321",
  appId: "1:1096519487321:web:22742c7b46894d894e8648",
};

// 🚀 Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 📊 Inicializar Realtime Database
export const database = getDatabase(app);

// 🔐 Inicializar Authentication
export const auth = getAuth(app);

export default app;
