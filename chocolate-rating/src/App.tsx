import { useState, useEffect } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from './firebase';

interface Chocolate {
  id: string;
  name: string;
}

interface Rating {
  userId: string;
  chocolateId: string;
  score: number;
}

interface Lobby {
  id: string;
  host: string;
  participants: string[];
  isVotingStarted: boolean;
  currentChocolateIndex: number;
  chocolates: Chocolate[];
  ratings: Rating[];
}

const SAMPLE_CHOCOLATES: Chocolate[] = [
  { id: '1', name: '1. Çikolata' },
  { id: '2', name: '2. Çikolata' },
  { id: '3', name: '3. Çikolata' },
];

function App() {
  const [username, setUsername] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentLobby?.id) {
      const lobbyRef = ref(database, `lobbies/${currentLobby.id}`);
      return onValue(lobbyRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCurrentLobby(data);
        }
      }, (error) => {
        setError('Veritabanı bağlantısında hata: ' + error.message);
      });
    }
  }, [currentLobby?.id]);

  const createLobby = async () => {
    try {
      if (!username) {
        setError('Lütfen bir kullanıcı adı girin');
        return;
      }
      const newLobby: Lobby = {
        //id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        id: 'MIKASA',
        host: username,
        participants: [username],
        isVotingStarted: false,
        currentChocolateIndex: 0,
        chocolates: SAMPLE_CHOCOLATES,
        ratings: []
      };
      await set(ref(database, `lobbies/${newLobby.id}`), newLobby);
      setCurrentLobby(newLobby);
      setError(null);
    } catch (err) {
      setError('Lobi oluşturulurken hata: ' + (err as Error).message);
    }
  };

  const joinLobby = async () => {
    try {
      if (!username) {
        setError('Lütfen bir kullanıcı adı girin');
        return;
      }
      if (!lobbyId) {
        setError('Lütfen bir lobi ID girin');
        return;
      }

      const lobbyRef = ref(database, `lobbies/${lobbyId}`);
      const snapshot = await new Promise((resolve, reject) => {
        onValue(lobbyRef, resolve, reject, { onlyOnce: true });
      });
      
      const data = (snapshot as any).val();
      if (!data) {
        setError('Lobi bulunamadı');
        return;
      }

      if (!data.participants.includes(username)) {
        const updatedLobby = {
          ...data,
          participants: [...data.participants, username]
        };
        await set(ref(database, `lobbies/${lobbyId}`), updatedLobby);
        setCurrentLobby(updatedLobby);
      } else {
        setCurrentLobby(data);
      }
      setError(null);
    } catch (err) {
      setError('Lobiye katılırken hata: ' + (err as Error).message);
    }
  };

  const startVoting = async () => {
    try {
      if (!currentLobby) return;
      const updatedLobby = {
        ...currentLobby,
        isVotingStarted: true
      };
      await set(ref(database, `lobbies/${currentLobby.id}`), updatedLobby);
      setError(null);
    } catch (err) {
      setError('Oylama başlatılırken hata: ' + (err as Error).message);
    }
  };

  const submitRating = async () => {
    try {
      if (!currentLobby || !username) return;
      const currentChocolate = currentLobby.chocolates[currentLobby.currentChocolateIndex];
      const newRating: Rating = {
        userId: username,
        chocolateId: currentChocolate.id,
        score: currentRating
      };

      const updatedLobby = {
        ...currentLobby,
        ratings: [...(currentLobby.ratings || []), newRating],
        currentChocolateIndex: 
          currentLobby.currentChocolateIndex === currentLobby.chocolates.length - 1
            ? currentLobby.currentChocolateIndex
            : currentLobby.currentChocolateIndex + 1
      };

      await set(ref(database, `lobbies/${currentLobby.id}`), updatedLobby);
      setError(null);
    } catch (err) {
      setError('Puan gönderilirken hata: ' + (err as Error).message);
    }
  };

  const calculateResults = () => {
    if (!currentLobby) return [];
    
    const results = currentLobby.chocolates.map(chocolate => {
      const chocolateRatings = (currentLobby.ratings || []).filter(r => r.chocolateId === chocolate.id);
      const averageScore = chocolateRatings.reduce((acc, curr) => acc + curr.score, 0) / 
        (chocolateRatings.length || 1);
      
      return {
        name: chocolate.name,
        averageScore: averageScore.toFixed(1),
        ratings: chocolateRatings
      };
    });

    return results.sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore));
  };

  if (!currentLobby) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h1 className="text-2xl font-bold mb-8 text-center text-brown-600">Çikolata Puanlama Sistemi</h1>
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                      {error}
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Kullanıcı adınızı girin"
                    />
                  </div>
                  <div className="flex flex-col space-y-4">
                    <button
                      onClick={createLobby}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Yeni Lobi Oluştur
                    </button>
                    <div className="text-center">veya</div>
                    <div className="mb-4">
                      <input
                        type="text"
                        value={lobbyId}
                        onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Lobi ID"
                      />
                    </div>
                    <button
                      onClick={joinLobby}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Lobiye Katıl
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentChocolate = currentLobby.chocolates[currentLobby.currentChocolateIndex];
  const hasVotedForCurrentChocolate = (currentLobby.ratings || []).some(
    r => r.userId === username && r.chocolateId === currentChocolate.id
  );
  const isVotingComplete = currentLobby.currentChocolateIndex === currentLobby.chocolates.length - 1 &&
    currentLobby.participants.every(participant =>
      (currentLobby.ratings || []).some(r => r.userId === participant && r.chocolateId === currentChocolate.id)
    );

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Lobi: {currentLobby.id}</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Katılımcılar:</h3>
            <ul className="list-disc pl-5">
              {currentLobby.participants.map((participant, index) => (
                <li key={index} className="text-gray-700">
                  {participant} {participant === currentLobby.host && '(Host)'}
                </li>
              ))}
            </ul>
          </div>

          {!currentLobby.isVotingStarted ? (
            currentLobby.host === username && (
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={startVoting}
              >
                Oylamayı Başlat
              </button>
            )
          ) : !isVotingComplete ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Şu anki Çikolata: {currentChocolate.name}
              </h3>
              {!hasVotedForCurrentChocolate ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={currentRating}
                      onChange={(e) => setCurrentRating(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-lg font-semibold">{currentRating}</span>
                  </div>
                  <button
                    onClick={submitRating}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Puanı Gönder
                  </button>
                </div>
              ) : (
                <p className="text-green-600">Bu çikolata için oy verdiniz!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Sonuçlar</h3>
              {calculateResults().map((result, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{result.name}</span>
                    <span className="text-lg font-bold">{result.averageScore}/10</span>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-semibold mb-1">Oylar:</h4>
                    {result.ratings.map((rating, rIndex) => (
                      <div key={rIndex} className="text-sm text-gray-600">
                        {rating.userId}: {rating.score}/10
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
