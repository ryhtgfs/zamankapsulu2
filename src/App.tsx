import { useState, useEffect } from 'react';
import { Clock, Lock, ThumbsUp, MessageCircle, Send, Calendar, User, Moon, Sun, Search, TrendingUp, Shuffle, Share2, Mail, BarChart3, Loader, CornerDownRight, Flag } from 'lucide-react';

const SUPABASE_URL = 'https://fsvclgyfoguitgmcjwpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdmNsZ3lmb2d1aXRnbWNqd3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODU0NjUsImV4cCI6MjA3NDk2MTQ2NX0.0-TnALwFekmJY-mNzog-iP0JVKhzb8iFRLXZOVycV1s';

interface Post {
  id: string;
  content: string;
  post_date: string;
  post_time: string;
  author_name: string;
  is_locked: boolean;
  unlock_date?: string;
  unlock_time?: string;
  original_date?: string;
  upvotes: number;
}

const supabase = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}&order=post_date.desc,post_time.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      const data = await response.json();
      return { data, error: null };
    },
    insert: async (values: any) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      return { data, error: null };
    },
    update: (values: any) => ({
      eq: async (column: string, value: any) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values)
        });
        const data = await response.json();
        return { data, error: null };
      }
    })
  })
};

function App() {
  const [activeView, setActiveView] = useState('timeline');
  const [darkMode, setDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [sortMode, setSortMode] = useState('date');
  const [showStats, setShowStats] = useState(false);
  const [showLockedDetails, setShowLockedDetails] = useState<{[key: string]: boolean}>({});
  
  const [newPost, setNewPost] = useState({
    content: '',
    author: '',
    isAnonymous: true,
    postType: 'now',
    futureDate: '',
    futureTime: '12:00',
    email: ''
  });

  const siteInfo = {
    name: 'Zaman Kapsülü',
    domain: 'zamankapsulu.com.tr',
    tagline: 'İnsanlığın Dijital Hafızası',
    subtitle: 'Zamanın ötesinde bir mesaj'
  };

  const isTimeToUnlock = (date: string, time: string) => {
    const now = new Date();
    const unlockDateTime = new Date(`${date}T${time}:00`);
    return now >= unlockDateTime;
  };

  const getCountdown = (date: string, time: string) => {
    const now = new Date();
    const unlockDateTime = new Date(`${date}T${time}:00`);
    const diff = unlockDateTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Açılıyor...';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 365) return `${Math.floor(days / 365)} yıl ${days % 365} gün`;
    if (days > 0) return `${days} gün ${hours} saat`;
    return `${hours} saat ${minutes} dakika`;
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from('posts').select('*');
      const formattedPosts = (data || []).map((post: any) => ({
        ...post,
        isLocked: post.is_locked && !isTimeToUnlock(post.unlock_date || post.post_date, post.unlock_time || post.post_time)
      }));
      setPosts(formattedPosts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let displayPosts = [...posts];

  if (filterMode === 'today') {
    const today = new Date().toISOString().split('T')[0];
    displayPosts = displayPosts.filter(p => p.post_date === today);
  } else if (filterMode === 'locked') {
    displayPosts = displayPosts.filter(p => p.is_locked);
  }

  if (searchQuery) {
    displayPosts = displayPosts.filter(p => 
      !p.is_locked && p.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (sortMode === 'popular') {
    displayPosts.sort((a, b) => b.upvotes - a.upvotes);
  }

  const groupedPosts = displayPosts.reduce((acc: any, post) => {
    if (!acc[post.post_date]) {
      acc[post.post_date] = { locked: [], unlocked: [] };
    }
    post.is_locked ? acc[post.post_date].locked.push(post) : acc[post.post_date].unlocked.push(post);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedPosts).sort();
  const topPost = displayPosts.filter(p => !p.is_locked).sort((a, b) => b.upvotes - a.upvotes)[0];
  
  const stats = {
    total: posts.length,
    locked: posts.filter(p => p.is_locked).length,
    totalUpvotes: posts.reduce((sum, p) => sum + p.upvotes, 0)
  };

  const handleUpvote = async (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post
    ));
    
    const post = posts.find(p => p.id === postId);
    if (post) {
      await supabase.from('posts').update({ upvotes: post.upvotes + 1 }).eq('id', postId);
    }
  };

  const handleSubmit = async () => {
    if (!newPost.content) {
      alert('Lütfen bir mesaj yazın!');
      return;
    }
    
    const now = new Date();
    const postDate = newPost.postType === 'now' ? now.toISOString().split('T')[0] : newPost.futureDate;
    const postTime = newPost.postType === 'now' ? `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` : newPost.futureTime;
    const isLocked = newPost.postType === 'future';
    
    const postData = {
      content: newPost.content,
      post_date: postDate,
      post_time: postTime,
      is_locked: isLocked,
      unlock_date: isLocked ? postDate : null,
      unlock_time: isLocked ? postTime : null,
      original_date: isLocked ? now.toISOString().split('T')[0] : null,
      author_name: newPost.isAnonymous ? 'Anonim' : newPost.author || 'Anonim',
      is_anonymous: newPost.isAnonymous,
      email: newPost.email || null,
      upvotes: 0
    };

    try {
      await supabase.from('posts').insert([postData]);
      await fetchPosts();
      setNewPost({
        content: '',
        author: '',
        isAnonymous: true,
        postType: 'now',
        futureDate: '',
        futureTime: '12:00',
        email: ''
      });
      setActiveView('timeline');
      alert('Mesaj başarıyla gönderildi!');
    } catch (err) {
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateShort = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const bgClass = darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';

  if (loading && posts.length === 0) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-white">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-500`}>
      <header className={`${darkMode ? 'bg-black/30' : 'bg-white/30'} backdrop-blur-md border-b ${darkMode ? 'border-purple-500/30' : 'border-purple-300/30'} sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Clock className={`w-10 h-10 ${darkMode ? 'text-purple-400' : 'text-purple-600'} animate-pulse`} />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{siteInfo.name}</h1>
                <p className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'} font-medium`}>{siteInfo.domain}</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={() => setShowStats(!showStats)} className={`p-2 rounded-lg ${darkMode ? 'text-purple-300 hover:bg-purple-800/30' : 'text-purple-600 hover:bg-purple-200'}`}>
                <BarChart3 className="w-5 h-5" />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'text-purple-300 hover:bg-purple-800/30' : 'text-purple-600 hover:bg-purple-200'}`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setActiveView('timeline')} className={`px-4 py-2 rounded-lg font-medium ${activeView === 'timeline' ? 'bg-purple-600 text-white' : darkMode ? 'text-purple-300 hover:bg-purple-800/30' : 'text-purple-600 hover:bg-purple-200'}`}>
                Duvarı Gör
              </button>
              <button onClick={() => setActiveView('post')} className={`px-4 py-2 rounded-lg font-medium ${activeView === 'post' ? 'bg-purple-600 text-white' : darkMode ? 'text-purple-300 hover:bg-purple-800/30' : 'text-purple-600 hover:bg-purple-200'}`}>
                Mesaj Bırak
              </button>
            </div>
          </div>
          <div className={`flex items-center justify-between ${darkMode ? 'text-purple-200 bg-purple-900/20' : 'text-purple-800 bg-white/50'} rounded-lg px-4 py-2`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className="font-mono text-lg font-bold">{formatTime(currentTime)}</span>
              </div>
              <div className="text-sm">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>
      </header>

      {showStats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowStats(false)}>
          <div className={`${darkMode ? 'bg-slate-900 border-purple-500/30' : 'bg-white border-purple-300'} border rounded-2xl p-8 max-w-md w-full`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>İstatistikler</h3>
            <div className="space-y-4">
              <div className={`flex justify-between ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                <span>Toplam Mesaj:</span>
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className={`flex justify-between ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                <span>Kilitli Mesajlar:</span>
                <span className="font-bold">{stats.locked}</span>
              </div>
              <div className={`flex justify-between ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                <span>Toplam Upvote:</span>
                <span className="font-bold">{stats.totalUpvotes}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeView === 'timeline' ? (
          <div className="space-y-8">
            <div className="text-center py-12 space-y-6">
              <h2 className={`text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{siteInfo.tagline}</h2>
              <p className={`text-xl ${darkMode ? 'text-purple-300' : 'text-purple-700'} font-medium`}>{siteInfo.subtitle}</p>
              
              {topPost && (
                <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30' : 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300'} border rounded-xl p-6 max-w-2xl mx-auto`}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Bugünün Öne Çıkanı</span>
                  </div>
                  <p className={`text-lg italic ${darkMode ? 'text-white' : 'text-gray-900'}`}>"{topPost.content}"</p>
                  <div className={`mt-3 text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{topPost.upvotes} upvote</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 justify-center flex-wrap">
              <div className={`flex items-center gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-white/70'} rounded-lg px-4 py-2`}>
                <Search className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <input
                  type="text"
                  placeholder="Mesaj ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent border-none outline-none ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                />
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setFilterMode('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterMode === 'all' ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800/50 text-purple-300' : 'bg-white/70 text-purple-600'}`}>
                  Tümü
                </button>
                <button onClick={() => setFilterMode('today')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterMode === 'today' ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800/50 text-purple-300' : 'bg-white/70 text-purple-600'}`}>
                  Bugün
                </button>
                <button onClick={() => setFilterMode('locked')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterMode === 'locked' ? 'bg-purple-600 text-white' : darkMode ? 'bg-slate-800/50 text-purple-300' : 'bg-white/70 text-purple-600'}`}>
                  Kilitli
                </button>
              </div>

              <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className={`px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-slate-800/50 text-purple-300 border-purple-500/30' : 'bg-white/70 text-purple-600 border-purple-300'} border`}>
                <option value="date">Tarihe Göre</option>
                <option value="popular">Popülerliğe Göre</option>
              </select>
            </div>

            <div className="relative">
              <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b ${darkMode ? 'from-purple-500 via-purple-700' : 'from-purple-400 via-purple-500'} to-transparent`}></div>

              {sortedDates.map((date) => (
                <div key={date} className="mb-12 relative">
                  <div className="flex justify-center mb-6">
                    <div className={`${darkMode ? 'bg-purple-600' : 'bg-purple-500'} text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg z-10 relative`}>
                      {formatDateShort(date)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {groupedPosts[date].locked.length > 0 && (
                      <div className={`relative ml-auto mr-8 w-[calc(50%-2rem)]`}>
                        <div className={`rounded-lg p-4 border-b-4 ${darkMode ? 'bg-gray-700/50 border-gray-500' : 'bg-gray-200/70 border-gray-400'} cursor-pointer`}
                        onClick={() => setShowLockedDetails({...showLockedDetails, [date]: !showLockedDetails[date]})}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Lock className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                                {groupedPosts[date].locked.length} Kilitli Mesaj
                              </span>
                            </div>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {showLockedDetails[date] ? '▼' : '▶'}
                            </span>
                          </div>
                          
                          {showLockedDetails[date] && (
                            <div className="mt-4 space-y-2 border-t border-gray-500/30 pt-3">
                              {groupedPosts[date].locked.map((post: Post) => (
                                <div key={post.id} className={`${darkMode ? 'bg-slate-800/50' : 'bg-white/50'} rounded p-3`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                      Açılma: {post.post_time}
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {post.author_name}
                                    </span>
                                  </div>
                                  <div className={`${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-200 text-purple-700'} rounded px-2 py-1 text-xs`}>
                                    {getCountdown(post.unlock_date || post.post_date, post.unlock_time || post.post_time)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {groupedPosts[date].unlocked.map((post: Post, idx: number) => (
                      <div key={post.id} className={`relative ${idx % 2 === 0 ? 'ml-auto mr-8' : 'mr-auto ml-8'} w-[calc(50%-2rem)]`}>
                        <div className={`rounded-lg p-4 border-b-4 hover:scale-105 transition-all shadow-xl ${darkMode ? 'bg-gradient-to-br from-green-600/20 to-emerald-700/20 border-green-500' : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-500'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`${darkMode ? 'text-purple-400' : 'text-purple-600'} text-xs`}>{post.post_time}</span>
                          </div>
                          
                          <p className={`text-base mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>"{post.content}"</p>

                          {post.original_date && (
                            <div className={`${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-200 text-purple-700'} rounded px-2 py-1 mb-2 text-xs inline-block`}>
                              {formatDateShort(post.original_date)} tarihinde bırakıldı
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <User className={`w-3 h-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                              <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>{post.author_name}</span>
                            </div>
                            
                            <button onClick={() => handleUpvote(post.id)} className={`flex items-center gap-1 ${darkMode ? 'text-purple-300 hover:text-purple-100' : 'text-purple-600 hover:text-purple-500'}`}>
                              <ThumbsUp className="w-3 h-3" />
                              <span>{post.upvotes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900/40 to-slate-900/40 border-purple-500/30' : 'bg-gradient-to-br from-purple-100/80 to-pink-100/80 border-purple-300'} rounded-2xl p-8 border shadow-2xl`}>
              <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-3`}>
                <Send className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                MESAJ BIRAK
              </h2>

              <div className="space-y-6">
                <div>
                  <label className={`block ${darkMode ? 'text-purple-300' : 'text-purple-700'} mb-2 font-medium`}>Yazın:</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className={`w-full h-32 ${darkMode ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400' : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500'} border rounded-lg p-4 resize-none`}
                    placeholder="Duygularınızı paylaşın..."
                  />
                </div>

                <div>
                  <label className={`block ${darkMode ? 'text-purple-300' : 'text-purple-700'} mb-2 font-medium`}>Takma ad:</label>
                  <input
                    type="text"
                    value={newPost.author}
                    onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                    disabled={newPost.isAnonymous}
                    className={`w-full ${darkMode ? 'bg-slate-800/50 border-purple-500/30 text-white' : 'bg-white border-purple-300 text-gray-900'} border rounded-lg p-3 disabled:opacity-50`}
                    placeholder="Opsiyonel..."
                  />
                  <label className={`flex items-center gap-2 mt-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'} cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={newPost.isAnonymous}
                      onChange={(e) => setNewPost({...newPost, isAnonymous: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span>Anonim olarak paylaş</span>
                  </label>
                </div>

                <div>
                  <label className={`block ${darkMode ? 'text-purple-300' : 'text-purple-700'} mb-3 font-medium flex items-center gap-2`}>
                    <Calendar className="w-5 h-5" />
                    Zaman ayarı:
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-2 ${darkMode? 'text-white' : 'text-gray-900'} cursor-pointer`}>
                      <input
                        type="radio"
                        checked={newPost.postType === 'now'}
                        onChange={() => setNewPost({...newPost, postType: 'now'})}
                        className="w-4 h-4"
                      />
                      <span>Hemen yayınla</span>
                    </label>
                    <label className={`flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'} cursor-pointer`}>
                      <input
                        type="radio"
                        checked={newPost.postType === 'future'}
                        onChange={() => setNewPost({...newPost, postType: 'future'})}
                        className="w-4 h-4"
                      />
                      <span>Gelecekte yayınla</span>
                    </label>
                    {newPost.postType === 'future' && (
                      <div className="ml-6 space-y-2">
                        <input
                          type="date"
                          value={newPost.futureDate}
                          onChange={(e) => setNewPost({...newPost, futureDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full ${darkMode ? 'bg-slate-800/50 border-purple-500/30 text-white' : 'bg-white border-purple-300 text-gray-900'} border rounded-lg p-3`}
                        />
                        <input
                          type="time"
                          value={newPost.futureTime}
                          onChange={(e) => setNewPost({...newPost, futureTime: e.target.value})}
                          className={`w-full ${darkMode ? 'bg-slate-800/50 border-purple-500/30 text-white' : 'bg-white border-purple-300 text-gray-900'} border rounded-lg p-3`}
                        />
                        <div className="flex items-center gap-2">
                          <Mail className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          <input
                            type="email"
                            placeholder="E-posta (hatırlatma için)"
                            value={newPost.email}
                            onChange={(e) => setNewPost({...newPost, email: e.target.value})}
                            className={`flex-1 ${darkMode ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400' : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500'} border rounded-lg p-3 text-sm`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`${darkMode ? 'bg-black/30 border-purple-500/30' : 'bg-white/30 border-purple-300'} backdrop-blur-md border-t mt-16 py-8`}>
        <div className={`max-w-6xl mx-auto px-4 text-center ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
          <div className="mb-4">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{siteInfo.name}</h3>
            <p className="text-sm opacity-70">{siteInfo.domain}</p>
          </div>
          <p className="text-lg font-medium mb-2">{siteInfo.tagline}</p>
          <p className="text-sm opacity-80">{siteInfo.subtitle}</p>
          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <p className="text-xs opacity-60">2025 {siteInfo.name}. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;