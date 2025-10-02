import { useState, useEffect } from 'react';
import { Clock, Lock, ThumbsUp, Send, Calendar, User, Moon, Sun, Search, TrendingUp, Mail, BarChart3, Loader, Sparkles, Heart, Star } from 'lucide-react';

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
    tagline: 'Geçmişten Geleceğe Köprü',
    subtitle: 'Anılarını sakla, geleceğe mesaj bırak'
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

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-xl text-white font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900' 
        : 'bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        darkMode 
          ? 'bg-black/40 border-purple-500/20' 
          : 'bg-white/40 border-purple-300/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <Clock className={`w-12 h-12 transition-all duration-500 group-hover:rotate-180 ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold bg-gradient-to-r ${
                  darkMode 
                    ? 'from-purple-400 via-pink-400 to-purple-400' 
                    : 'from-purple-600 via-pink-600 to-purple-600'
                } bg-clip-text text-transparent`}>
                  {siteInfo.name}
                </h1>
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {siteInfo.domain}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 items-center">
              <button 
                onClick={() => setShowStats(!showStats)} 
                className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => setActiveView('timeline')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  activeView === 'timeline'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : darkMode
                      ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
              >
                Duvarı Gör
              </button>
              
              <button 
                onClick={() => setActiveView('post')}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  activeView === 'post'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : darkMode
                      ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
              >
                Mesaj Bırak
              </button>
            </div>
          </div>
          
          <div className={`flex items-center justify-between rounded-2xl px-6 py-3 transition-all duration-300 ${
            darkMode 
              ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20' 
              : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
          }`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Clock className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`font-mono text-xl font-bold ${
                  darkMode ? 'text-purple-200' : 'text-purple-900'
                }`}>
                  {formatTime(currentTime)}
                </span>
              </div>
              <div className={`text-sm font-medium ${
                darkMode ? 'text-purple-300' : 'text-purple-700'
              }`}>
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowStats(false)}>
          <div 
            className={`rounded-3xl p-8 max-w-md w-full transform transition-all duration-300 scale-100 ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30' 
                : 'bg-white border border-purple-300 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                İstatistikler
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-purple-500/10' : 'bg-purple-50'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                    Toplam Mesaj
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {stats.total}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-pink-500/10' : 'bg-pink-50'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-pink-200' : 'text-pink-800'}`}>
                    Kilitli Mesajlar
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                    {stats.locked}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${
                darkMode ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                    Toplam Beğeni
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {stats.totalUpvotes}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {activeView === 'timeline' ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center py-16 space-y-8">
              <h2 className={`text-6xl font-bold bg-gradient-to-r ${
                darkMode 
                  ? 'from-purple-400 via-pink-400 to-purple-400' 
                  : 'from-purple-600 via-pink-600 to-purple-600'
              } bg-clip-text text-transparent animate-fade-in`}>
                {siteInfo.tagline}
              </h2>
              <p className={`text-2xl font-medium ${
                darkMode ? 'text-purple-300' : 'text-purple-700'
              }`}>
                {siteInfo.subtitle}
              </p>
              
              {topPost && (
                <div className={`rounded-3xl p-8 max-w-3xl mx-auto transform hover:scale-105 transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30' 
                    : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-300'
                } backdrop-blur-sm shadow-2xl`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Star className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} animate-pulse`} />
                    <span className={`font-bold text-lg ${
                      darkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      Bugünün Öne Çıkanı
                    </span>
                  </div>
                  <p className={`text-xl italic leading-relaxed ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    "{topPost.content}"
                  </p>
                  <div className={`mt-4 flex items-center gap-2 ${
                    darkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    <Heart className="w-5 h-5 fill-current" />
                    <span className="font-semibold">{topPost.upvotes} beğeni</span>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 justify-center flex-wrap">
              <div className={`flex items-center gap-3 rounded-2xl px-6 py-3 transition-all duration-300 ${
                darkMode 
                  ? 'bg-slate-800/50 border border-purple-500/20' 
                  : 'bg-white/70 border border-purple-200 shadow-lg'
              }`}>
                <Search className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <input
                  type="text"
                  placeholder="Mesaj ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent border-none outline-none w-64 ${
                    darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div className="flex gap-3">
                {['all', 'today', 'locked'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                      filterMode === mode
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : darkMode
                          ? 'bg-slate-800/50 text-purple-300 border border-purple-500/20'
                          : 'bg-white/70 text-purple-600 border border-purple-200'
                    }`}
                  >
                    {mode === 'all' ? 'Tümü' : mode === 'today' ? 'Bugün' : 'Kilitli'}
                  </button>
                ))}
              </div>

              <select 
                value={sortMode} 
                onChange={(e) => setSortMode(e.target.value)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-800/50 text-purple-300 border border-purple-500/20' 
                    : 'bg-white/70 text-purple-600 border border-purple-200'
                }`}
              >
                <option value="date">Tarihe Göre</option>
                <option value="popular">Popülerliğe Göre</option>
              </select>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b ${
                darkMode 
                  ? 'from-purple-500 via-pink-500 to-transparent' 
                  : 'from-purple-400 via-pink-400 to-transparent'
              } rounded-full`}></div>

              {sortedDates.map((date, dateIdx) => (
                <div key={date} className="mb-16 relative animate-fade-in" style={{animationDelay: `${dateIdx * 100}ms`}}>
                  <div className="flex justify-center mb-8">
                    <div className={`px-8 py-3 rounded-full font-bold text-lg shadow-xl z-10 relative backdrop-blur-sm ${
                      darkMode 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    }`}>
                      {formatDateShort(date)}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {groupedPosts[date].locked.length > 0 && (
                      <div className="relative ml-auto mr-8 w-[calc(50%-2rem)]">
                        <div 
                          className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                            darkMode 
                              ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-600/30' 
                              : 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300'
                          } backdrop-blur-sm shadow-xl`}
                          onClick={() => setShowLockedDetails({...showLockedDetails, [date]: !showLockedDetails[date]})}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Lock className={`w-7 h-7 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                              <span className={`font-semibold text-lg ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {groupedPosts[date].locked.length} Kilitli Mesaj
                              </span>
                            </div>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {showLockedDetails[date] ? '▼' : '▶'}
                            </span>
                          </div>
                          
                          {showLockedDetails[date] && (
                            <div className="mt-4 space-y-3 border-t border-gray-500/30 pt-4">
                              {groupedPosts[date].locked.map((post: Post) => (
                                <div key={post.id} className={`rounded-xl p-4 ${
                                  darkMode ? 'bg-slate-800/50' : 'bg-white/50'
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-sm font-medium ${
                                      darkMode ? 'text-purple-400' : 'text-purple-600'
                                    }`}>
                                      Açılma: {post.post_time}
                                    </span>
                                    <span className={`text-sm ${
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {post.author_name}
                                    </span>
                                  </div>
                                  <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                    darkMode 
                                      ? 'bg-purple-900/30 text-purple-300' 
                                      : 'bg-purple-200 text-purple-700'
                                  }`}>
                                    ⏰ {getCountdown(post.unlock_date || post.post_date, post.unlock_time || post.post_time)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {groupedPosts[date].unlocked.map((post: Post, idx: number) => (
                      <div 
                        key={post.id} 
                        className={`relative ${idx % 2 === 0 ? 'ml-auto mr-8' : 'mr-auto ml-8'} w-[calc(50%-2rem)]`}
                      >
                        <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:rotate-1 shadow-2xl ${
                          darkMode 
                            ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30' 
                            : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300'
                        } backdrop-blur-sm`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-semibold ${
                              darkMode ? 'text-emerald-400' : 'text-emerald-700'
                            }`}>
                              🕐 {post.post_time}
                            </span>
                          </div>
                          
                          <p className={`text-lg leading-relaxed mb-4 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            "{post.content}"
                          </p>

                          {post.original_date && (
                            <div className={`rounded-lg px-3 py-1.5 mb-3 text-xs font-medium inline-block ${
                              darkMode 
                                ? 'bg-purple-900/30 text-purple-300' 
                                : 'bg-purple-200 text-purple-700'
                            }`}>
                              📅 {formatDateShort(post.original_date)} tarihinde bırakıldı
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2">
                              <User className={`w-4 h-4 ${
                                darkMode ? 'text-emerald-400' : 'text-emerald-600'
                              }`} />
                              <span className={`font-medium ${
                                darkMode ? 'text-emerald-300' : 'text-emerald-700'
                              }`}>
                                {post.author_name}
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => handleUpvote(post.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-110 ${
                                darkMode 
                                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300' 
                                  : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-700'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
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
          <div className="max-w-3xl mx-auto">
            <div className={`rounded-3xl p-10 shadow-2xl backdrop-blur-sm transition-all duration-300 ${
              darkMode 
                ? 'bg-gradient-to-br from-purple-900/50 to-slate-900/50 border border-purple-500/30' 
                : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300'
            }`}>
              <h2 className={`text-4xl font-bold mb-8 flex items-center gap-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Send className={`w-10 h-10 ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                Mesaj Bırak
              </h2>

              <div className="space-y-6">
                <div>
                  <label className={`block mb-3 font-semibold text-lg ${
                    darkMode ? 'text-purple-300' : 'text-purple-700'
                  }`}>
                    Mesajınız:
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className={`w-full h-40 rounded-2xl p-5 resize-none text-lg transition-all duration-300 focus:ring-4 ${
                      darkMode 
                        ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:ring-purple-500/30' 
                        : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500 focus:ring-purple-300/50'
                    } border-2`}
                    placeholder="Duygularınızı, düşüncelerinizi paylaşın..."
                  />
                </div>

                <div>
                  <label className={`block mb-3 font-semibold text-lg ${
                    darkMode ? 'text-purple-300' : 'text-purple-700'
                  }`}>
                    Takma Ad:
                  </label>
                  <input
                    type="text"
                    value={newPost.author}
                    onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                    disabled={newPost.isAnonymous}
                    className={`w-full rounded-2xl p-4 text-lg transition-all duration-300 focus:ring-4 disabled:opacity-50 ${
                      darkMode 
                        ? 'bg-slate-800/50 border-purple-500/30 text-white focus:ring-purple-500/30' 
                        : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-300/50'
                    } border-2`}
                    placeholder="İsteğe bağlı..."
                  />
                  <label className={`flex items-center gap-3 mt-3 cursor-pointer ${
                    darkMode ? 'text-purple-300' : 'text-purple-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newPost.isAnonymous}
                      onChange={(e) => setNewPost({...newPost, isAnonymous: e.target.checked})}
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-medium">Anonim olarak paylaş</span>
                  </label>
                </div>

                <div>
                  <label className={`block mb-4 font-semibold text-lg flex items-center gap-3 ${
                    darkMode ? 'text-purple-300' : 'text-purple-700'
                  }`}>
                    <Calendar className="w-6 h-6" />
                    Zaman Ayarı:
                  </label>
                  <div className="space-y-4">
                    <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      newPost.postType === 'now'
                        ? darkMode
                          ? 'bg-purple-500/20 border-2 border-purple-500'
                          : 'bg-purple-100 border-2 border-purple-500'
                        : darkMode
                          ? 'bg-slate-800/30 border-2 border-transparent hover:bg-slate-800/50'
                          : 'bg-white/50 border-2 border-transparent hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        checked={newPost.postType === 'now'}
                        onChange={() => setNewPost({...newPost, postType: 'now'})}
                        className="w-5 h-5"
                      />
                      <span className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        🚀 Hemen yayınla
                      </span>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      newPost.postType === 'future'
                        ? darkMode
                          ? 'bg-purple-500/20 border-2 border-purple-500'
                          : 'bg-purple-100 border-2 border-purple-500'
                        : darkMode
                          ? 'bg-slate-800/30 border-2 border-transparent hover:bg-slate-800/50'
                          : 'bg-white/50 border-2 border-transparent hover:bg-white'
                    }`}>
                      <input
                        type="radio"
                        checked={newPost.postType === 'future'}
                        onChange={() => setNewPost({...newPost, postType: 'future'})}
                        className="w-5 h-5"
                      />
                      <span className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        ⏰ Gelecekte yayınla
                      </span>
                    </label>
                    
                    {newPost.postType === 'future' && (
                      <div className="ml-6 space-y-4 animate-fade-in">
                        <input
                          type="date"
                          value={newPost.futureDate}
                          onChange={(e) => setNewPost({...newPost, futureDate: e.target.value})}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full rounded-xl p-4 text-lg transition-all duration-300 focus:ring-4 ${
                            darkMode 
                              ? 'bg-slate-800/50 border-purple-500/30 text-white focus:ring-purple-500/30' 
                              : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-300/50'
                          } border-2`}
                        />
                        <input
                          type="time"
                          value={newPost.futureTime}
                          onChange={(e) => setNewPost({...newPost, futureTime: e.target.value})}
                          className={`w-full rounded-xl p-4 text-lg transition-all duration-300 focus:ring-4 ${
                            darkMode 
                              ? 'bg-slate-800/50 border-purple-500/30 text-white focus:ring-purple-500/30' 
                              : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-300/50'
                          } border-2`}
                        />
                        <div className="flex items-center gap-3">
                          <Mail className={`w-5 h-5 ${
                            darkMode ? 'text-purple-400' : 'text-purple-600'
                          }`} />
                          <input
                            type="email"
                            placeholder="E-posta (hatırlatma için)"
                            value={newPost.email}
                            onChange={(e) => setNewPost({...newPost, email: e.target.value})}
                            className={`flex-1 rounded-xl p-4 text-lg transition-all duration-300 focus:ring-4 ${
                              darkMode 
                                ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:ring-purple-500/30' 
                                : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500 focus:ring-purple-300/50'
                            } border-2`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-5 rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 transition-all duration-300 shadow-2xl shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg hover:scale-105 transform"
                >
                  {loading ? 'Gönderiliyor...' : '✨ Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`backdrop-blur-xl border-t mt-20 py-12 transition-all duration-300 ${
        darkMode 
          ? 'bg-black/40 border-purple-500/20' 
          : 'bg-white/40 border-purple-300/30'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <h3 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${
              darkMode 
                ? 'from-purple-400 via-pink-400 to-purple-400' 
                : 'from-purple-600 via-pink-600 to-purple-600'
            } bg-clip-text text-transparent`}>
              {siteInfo.name}
            </h3>
            <p className={`text-sm font-medium ${
              darkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {siteInfo.domain}
            </p>
          </div>
          <p className={`text-lg font-medium mb-2 ${
            darkMode ? 'text-purple-300' : 'text-purple-700'
          }`}>
            {siteInfo.tagline}
          </p>
          <p className={`text-sm mb-8 ${
            darkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>
            {siteInfo.subtitle}
          </p>
          <div className={`pt-6 border-t ${
            darkMode ? 'border-purple-500/20' : 'border-purple-300/30'
          }`}>
            <p className={`text-xs ${
              darkMode ? 'text-purple-400/60' : 'text-purple-600/60'
            }`}>
              © 2025 {siteInfo.name}. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
