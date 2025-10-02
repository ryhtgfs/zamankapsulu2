import { useState, useEffect } from 'react';
import { Clock, Loader } from 'lucide-react';

const SUPABASE_URL = 'https://fsvclgyfoguitgmcjwpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdmNsZ3lmb2d1aXRnbWNqd3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODU0NjUsImV4cCI6MjA3NDk2MTQ2NX0.0-TnALwFekmJY-mNzog-iP0JVKhzb8iFRLXZOVycV1s';

interface Post {
  id: string;
  content: string;
  post_date: string;
  post_time: string;
  author_name: string;
  is_locked: boolean;
}

const supabase = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      const data = await response.json();
      return { data, error: null };
    }
  })
};

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const siteInfo = {
    name: 'Zaman Kapsülü',
    domain: 'zamankapsulu.com.tr',
    tagline: 'İnsanlığın Dijital Hafızası',
    subtitle: 'Zamanın ötesinde bir mesaj'
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('posts').select('*');
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-white">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/30 backdrop-blur-md border-b border-purple-500/30 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="w-12 h-12 text-purple-400 animate-pulse" />
            <h1 className="text-4xl font-bold text-white">{siteInfo.name}</h1>
          </div>
          <p className="text-purple-300 text-lg">{siteInfo.tagline}</p>
          <p className="text-purple-400 text-sm">{siteInfo.domain}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-white mb-4">
            {siteInfo.subtitle}
          </h2>
          <p className="text-xl text-purple-300">
            Backend bağlantısı başarılı
          </p>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-8 text-center">
              <p className="text-white text-lg">Henüz mesaj yok</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gradient-to-br from-green-600/20 to-emerald-700/20 border-b-4 border-green-500 rounded-lg p-6 backdrop-blur-sm">
                <p className="text-white text-lg mb-2">{post.content}</p>
                <div className="flex justify-between items-center text-sm text-purple-300">
                  <span>{post.author_name || 'Anonim'}</span>
                  <span>{post.post_date}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 bg-purple-900/40 border border-purple-500/30 rounded-xl p-6 text-center">
          <p className="text-green-400 text-lg font-bold mb-2">
            Supabase Bağlantısı Aktif
          </p>
          <p className="text-white">
            Toplam {posts.length} mesaj yüklendi
          </p>
        </div>
      </main>

      <footer className="bg-black/30 backdrop-blur-md border-t border-purple-500/30 mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-purple-300">
          <p>2025 {siteInfo.name}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;