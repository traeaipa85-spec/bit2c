// 🌍 Hook simples para detectar país do cliente por IP
import { useState, useEffect } from 'react';

/**
 * Hook simples para detectar país por IP
 * @returns {Object} Objeto com informações do país
 */
export const useClientCountry = () => {
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectCountryByIP = async () => {
      try {
        setLoading(true);
        
        // Detectar país por IP usando múltiplas APIs
        let detectedCountry = null;
        
        // Tentar primeira API
        try {
          const response1 = await fetch('https://ipapi.co/json/');
          const data1 = await response1.json();
          
          if (data1.country_code && data1.country_name) {
            detectedCountry = {
              code: data1.country_code,
              name: data1.country_name,
              ip: data1.ip || 'Unknown'
            };
            console.log('🌍 País detectado por ipapi.co:', detectedCountry);
          }
        } catch (err) {
          console.warn('Erro na primeira API:', err);
        }
        
        // Se não funcionou, tentar segunda API
        if (!detectedCountry) {
          try {
            const response2 = await fetch('https://api.country.is/');
            const data2 = await response2.json();
            
            if (data2.country) {
              detectedCountry = {
                code: data2.country,
                name: data2.country, // Esta API só retorna o código
                ip: data2.ip || 'Unknown'
              };
              console.log('🌍 País detectado por country.is:', detectedCountry);
            }
          } catch (err) {
            console.warn('Erro na segunda API:', err);
          }
        }
        
        // Se ainda não funcionou, tentar terceira API
        if (!detectedCountry) {
          try {
            const response3 = await fetch('https://ipinfo.io/json');
            const data3 = await response3.json();
            
            if (data3.country) {
              detectedCountry = {
                code: data3.country,
                name: data3.country,
                ip: data3.ip || 'Unknown'
              };
              console.log('🌍 País detectado por ipinfo.io:', detectedCountry);
            }
          } catch (err) {
            console.warn('Erro na terceira API:', err);
          }
        }
        
        setCountry(detectedCountry);
        
      } catch (error) {
        console.warn('Erro geral ao detectar país por IP:', error);
        setCountry(null);
      } finally {
        setLoading(false);
      }
    };

    detectCountryByIP();
  }, []);

  return { country, loading };
};