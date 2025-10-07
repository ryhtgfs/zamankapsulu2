import { useState, useEffect, useRef } from 'react';
import { Clock, Lock, ThumbsUp, Send, Calendar, User, Moon, Sun, Search, TrendingUp, Mail, BarChart3, Loader, Sparkles, Heart, Star, Smile, X, CheckCircle, AlertCircle } from 'lucide-react';

const SUPABASE_URL = 'https://fsvclgyfoguitgmcjwpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdmNsZ3lmb2d1aXRnbWNqd3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODU0NjUsImV4cCI6MjA3NDk2MTQ2NX0.0-TnALwFekmJY-mNzog-iP0JVKhzb8iFRLXZOVycV1s';

const EMOJIS = ['😊', '😂', '❤️', '🎉', '👍', '🙏', '💪', '🔥', '✨', '🌟', '💯', '🎊', '😍', '🤗', '😎', '🥳', '💖', '🌈', '⭐', '💫'];

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

interface AlertModal {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const supabase = {
  from: (table: string) => ({
    select: async (columns = '*') => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}&order=post_date.asc,post_time.asc`, {
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
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(values)
        });
        const data = await response.json();
        return { data, error: response.ok ? null : 'Error' };
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
  const [upvotedPosts, setUpvotedPosts] = useState<Set<string>>(new Set());
  const [hasScrolled, setHasScrolled] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [visibleDate, setVisibleDate] = useState('');
  const [dateDirection, setDateDirection] = useState<'up' | 'down'>('down');
  const [alertModal, setAlertModal] = useState<AlertModal>({ show: false, type: 'success', message: '' });
  const todayRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const lastScrollY = useRef(0);
  
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

  const showAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlertModal({ show: true, type, message });
    setTimeout(() => {
      setAlertModal({ show: false, type: 'success', message: '' });
    }, 3000);
  };

  const isTimeToUnlock = (unlockDate: string, unlockTime: string) => {
    if (!unlockDate || !unlockTime) return true;
    
    const now = new Date();
    const unlock = new Date(`${unlockDate}T${unlockTime}`);
    return now >= unlock;
  };

  const getCountdown = (date: string, time: string) => {
    if (!date || !time) {
      return 'Tarih belirtilmemiş';
    }
    
    const now = new Date();
    const unlockDateTime = new Date(`${date}T${time}`);
    
    if (isNaN(unlockDateTime.getTime())) {
      return 'Geçersiz tarih';
    }
    
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
      
      const formattedPosts = (data || []).map((post: any) => {
        const shouldBeLocked = post.unlock_date && post.unlock_time 
          ? !isTimeToUnlock(post.unlock_date, post.unlock_time)
          : false;
        
        return {
          ...post,
          is_locked: shouldBeLocked
        };
      });
      
      setPosts(formattedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    const saved = localStorage.getItem('upvotedPosts');
    if (saved) {
      try {
        setUpvotedPosts(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Error loading upvoted posts:', e);
      }
    }
    
    const scrolled = localStorage.getItem('hasScrolledToToday');
    if (scrolled) {
      setHasScrolled(true);
    }
    
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    const unlockTimer = setInterval(() => {
      fetchPosts();
    }, 60000);
    
    return () => {
      clearInterval(timeTimer);
      clearInterval(unlockTimer);
    };
  }, []);

  useEffect(() => {
    if (!loading && todayRef.current && !hasScrolled) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHasScrolled(true);
        localStorage.setItem('hasScrolledToToday', 'true');
      }, 500);
    }
  }, [loading, hasScrolled]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      lastScrollY.current = currentScrollY;

      const dateElements = Object.entries(dateRefs.current);
      
      for (const [date, element] of dateElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            if (visibleDate !== date) {
              setDateDirection(scrollDirection);
              setVisibleDate(date);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts, visibleDate]);

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
    const dateKey = post.is_locked && post.unlock_date ? post.unlock_date : post.post_date;
    if (!acc[dateKey]) {
      acc[dateKey] = { locked: [], unlocked: [] };
    }
    post.is_locked ? acc[dateKey].locked.push(post) : acc[dateKey].unlocked.push(post);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedPosts).sort();
  const topPost = displayPosts.filter(p => !p.is_locked).sort((a, b) => b.upvotes - a.upvotes)[0];
  const todayDate = new Date().toISOString().split('T')[0];
  
  const stats = {
    total: posts.length,
    locked: posts.filter(p => p.is_locked).length,
    totalUpvotes: posts.reduce((sum, p) => sum + p.upvotes, 0)
  };

  const handleUpvote = async (postId: string) => {
    if (upvotedPosts.has(postId)) {
      return;
    }
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const newUpvoteCount = post.upvotes + 1;
      
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, upvotes: newUpvoteCount } : p
      ));
      
      const newUpvoted = new Set(upvotedPosts);
      newUpvoted.add(postId);
      setUpvotedPosts(newUpvoted);
      localStorage.setItem('upvotedPosts', JSON.stringify([...newUpvoted]));
      
      const { error } = await supabase.from('posts').update({ upvotes: newUpvoteCount }).eq('id', postId);
      
      if (error) {
        setPosts(posts.map(p => 
          p.id === postId ? { ...p, upvotes: post.upvotes } : p
        ));
        const revertUpvoted = new Set(upvotedPosts);
        revertUpvoted.delete(postId);
        setUpvotedPosts(revertUpvoted);
        localStorage.setItem('upvotedPosts', JSON.stringify([...revertUpvoted]));
        showAlert('error', 'Beğeni kaydedilemedi!');
      }
      
    } catch (err) {
      console.error('Error updating upvote:', err);
      showAlert('error', 'Bir hata oluştu!');
    }
  };

  const handleSubmit = async () => {
    if (!newPost.content) {
      showAlert('warning', 'Lütfen bir mesaj yazın!');
      return;
    }
    
    if (newPost.postType === 'future' && (!newPost.futureDate || !newPost.futureTime)) {
      showAlert('warning', 'Lütfen gelecek tarih ve saat belirtin!');
      return;
    }
    
    const now = new Date();
    const isLocked = newPost.postType === 'future';
    
    const postData = {
      content: newPost.content,
      post_date: isLocked ? newPost.futureDate : now.toISOString().split('T')[0],
      post_time: isLocked ? newPost.futureTime : `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      is_locked: isLocked,
      unlock_date: isLocked ? newPost.futureDate : null,
      unlock_time: isLocked ? newPost.futureTime : null,
      original_date: isLocked ? now.toISOString().split('T')[0] : null,
      author_name: newPost.isAnonymous ? 'Anonim' : (newPost.author || 'Anonim'),
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
      showAlert('success', 'Mesaj başarıyla gönderildi!');
    } catch (err) {
      console.error('Error submitting post:', err);
      showAlert('error', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const addEmoji = (emoji: string) => {
    setNewPost({...newPost, content: newPost.content + emoji});
    setShowEmojiPicker(false);
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
  }return (
    <div className={`min-h-screen transition-all duration-700 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900' 
        : 'bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50'
    }`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {alertModal.show && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2">
          <div className={`rounded-xl p-4 shadow-2xl backdrop-blur-xl border-2 min-w-[300px] max-w-md ${
            darkMode 
              ? 'bg-slate-900/90 border-purple-500/30' 
              : 'bg-white/90 border-purple-300'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                alertModal.type === 'success' ? 'text-green-400' :
                alertModal.type === 'error' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {alertModal.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {alertModal.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {alertModal.type === 'warning' && <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {alertModal.message}
                </p>
              </div>
              <button 
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className={`transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        darkMode 
          ? 'bg-black/40 border-purple-500/20' 
          : 'bg-white/40 border-purple-300/30'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-3">
            <div 
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => setActiveView('timeline')}
            >
              <div className="relative">
                <Clock className={`w-10 h-10 transition-all duration-500 group-hover:rotate-180 ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${
                  darkMode 
                    ? 'from-purple-400 via-pink-400 to-purple-400' 
                    : 'from-purple-600 via-pink-600 to-purple-600'
                } bg-clip-text text-transparent transition-all group-hover:scale-105`}>
                  {siteInfo.name}
                </h1>
                <p className={`text-xs font-medium ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>
                  {siteInfo.domain}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <button 
                onClick={scrollToToday}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
                title="Bugüne git"
              >
                <Calendar className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => setShowStats(!showStats)} 
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              <button 
                onClick={() => setActiveView('timeline')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 ${
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
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 ${
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
          
          <div className={`flex items-center justify-between rounded-xl px-4 py-2 transition-all duration-300 ${
            darkMode 
              ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20' 
              : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`font-mono text-lg font-bold ${
                  darkMode ? 'text-purple-200' : 'text-purple-900'
                }`}>
                  {formatTime(currentTime)}
                </span>
              </div>
              <div className={`text-xs font-medium ${
                darkMode ? 'text-purple-300' : 'text-purple-700'
              }`}>
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {visibleDate && activeView === 'timeline' && (
        <div className="fixed top-[140px] left-1/2 transform -translate-x-1/2 z-[60] pointer-events-none overflow-hidden">
          <div 
            key={visibleDate}
            className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm ${
              dateDirection === 'down' 
                ? 'animate-in slide-in-from-top-5 fade-in duration-500' 
                : 'animate-in slide-in-from-bottom-5 fade-in duration-500'
            } ${
              darkMode 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }`}
          >
            {formatDateShort(visibleDate)}
          </div>
        </div>
      )}

      {showStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowStats(false)}>
          <div 
            className={`rounded-3xl p-8 max-w-md w-full transform transition-all duration-300 ${
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
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                    Toplam Mesaj
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {stats.total}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-pink-500/10' : 'bg-pink-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-pink-200' : 'text-pink-800'}`}>
                    Kilitli Mesajlar
                  </span>
                  <span className={`text-2xl font-bold ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                    {stats.locked}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <div className={`transition-all duration-500 ${
          activeView === 'timeline' 
            ? 'opacity-100 translate-x-0' 
            : activeView === 'post' 
              ? 'opacity-0 -translate-x-full absolute inset-0' 
              : 'opacity-0 translate-x-full absolute inset-0'
        }`}>
          {activeView === 'timeline' && (
            <div className="space-y-6">
              <div className="text-center py-8 space-y-4">
                <h2 className={`text-4xl font-bold bg-gradient-to-r pb-2 ${
                  darkMode 
                    ? 'from-purple-400 via-pink-400 to-purple-400' 
                    : 'from-purple-600 via-pink-600 to-purple-600'
                } bg-clip-text text-transparent`}>
                  {siteInfo.tagline}
                </h2>
                <p className={`text-lg font-medium ${
                  darkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>
                  {siteInfo.subtitle}
                </p>
                
                {topPost && (
                  <div className={`rounded-xl p-4 max-w-xl mx-auto transform hover:scale-105 transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30' 
                      : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-300'
                  } backdrop-blur-sm shadow-lg`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} animate-pulse`} />
                      <span className={`font-bold text-sm ${
                        darkMode ? 'text-purple-300' : 'text-purple-700'
                      }`}>
                        Bugünün Öne Çıkanı
                      </span>
                    </div>
                    <p className={`text-sm italic leading-relaxed ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      "{topPost.content}"
                    </p>
                    <div className={`mt-2 flex items-center gap-1 ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      <Heart className="w-3 h-3 fill-current" />
                      <span className="font-semibold text-xs">{topPost.upvotes} beğeni</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 justify-center flex-wrap">
                <div className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300 ${
                  darkMode 
                    ? 'bg-slate-800/50 border border-purple-500/20' 
                    : 'bg-white/70 border border-purple-200 shadow-lg'
                }`}>
                  <Search className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <input
                    type="text"
                    placeholder="Mesaj ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-transparent border-none outline-none w-48 text-sm ${
                      darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className="flex gap-2">
                  {['all', 'today', 'locked'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFilterMode(mode)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 ${
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
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-800/50 text-purple-300 border border-purple-500/20' 
                      : 'bg-white/70 text-purple-600 border border-purple-200'
                  }`}
                >
                  <option value="date">Tarihe Göre</option>
                  <option value="popular">Popülerliğe Göre</option>
                </select>
              </div>

              <div className="relative">
                <div className={`absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b ${
                  darkMode 
                    ? 'from-purple-500 via-pink-500 to-transparent' 
                    : 'from-purple-400 via-pink-400 to-transparent'
                } rounded-full`}></div>{sortedDates.map((date, dateIdx) => (
                  <div 
                    key={date} 
                    ref={(el) => {
                      dateRefs.current[date] = el;
                      if (date === todayDate) {
                        todayRef.current = el;
                      }
                    }}
                    className="mb-8 relative" 
                  >
                    <div className="flex justify-center mb-4">
                      <div className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-lg z-10 relative backdrop-blur-sm ${
                        darkMode 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      }`}>
                        {formatDateShort(date)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {groupedPosts[date].locked.length > 0 && (
                        <div className="relative ml-auto mr-8 w-[calc(50%-2rem)]">
                          <div 
                            className={`rounded-lg p-3 cursor-pointer transition-all duration-300 hover:scale-105 ${
                              darkMode 
                                ? 'bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-600/30' 
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300'
                            } backdrop-blur-sm shadow-md`}
                            onClick={() => setShowLockedDetails({...showLockedDetails, [date]: !showLockedDetails[date]})}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Lock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                <span className={`font-semibold text-sm ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {groupedPosts[date].locked.length} Kilitli Mesaj
                                </span>
                              </div>
                              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {showLockedDetails[date] ? '▼' : '▶'}
                              </span>
                            </div>
                            
                            {showLockedDetails[date] && (
                              <div className="mt-2 space-y-2 border-t border-gray-500/30 pt-2">
                                {groupedPosts[date].locked.map((post: Post) => (
                                  <div key={post.id} className={`rounded p-2 ${
                                    darkMode ? 'bg-slate-800/50' : 'bg-white/50'
                                  }`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`text-xs font-medium ${
                                        darkMode ? 'text-purple-400' : 'text-purple-600'
                                      }`}>
                                        {post.unlock_time}
                                      </span>
                                      <span className={`text-xs ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {post.author_name}
                                      </span>
                                    </div>
                                    {post.original_date && (
                                      <div className={`text-xs mb-1 ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {formatDateShort(post.original_date)} tarihinde bırakıldı
                                      </div>
                                    )}
                                    <div className={`rounded px-2 py-0.5 text-xs font-medium ${
                                      darkMode 
                                        ? 'bg-purple-900/30 text-purple-300' 
                                        : 'bg-purple-200 text-purple-700'
                                    }`}>
                                      {getCountdown(post.unlock_date || '', post.unlock_time || '')}
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
                          <div className={`rounded-lg p-3 transition-all duration-300 hover:scale-105 shadow-md ${
                            darkMode 
                              ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30' 
                              : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300'
                          } backdrop-blur-sm`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${
                                darkMode ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                {post.post_time}
                              </span>
                            </div>
                            
                            <p className={`text-sm leading-snug mb-2 ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              "{post.content}"
                            </p>

                            {post.original_date && (
                              <div className={`rounded px-2 py-0.5 mb-1.5 text-xs font-medium inline-block ${
                                darkMode 
                                  ? 'bg-purple-900/30 text-purple-300' 
                                  : 'bg-purple-200 text-purple-700'
                              }`}>
                                {formatDateShort(post.original_date)} tarihinde bırakıldı
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                              <div className="flex items-center gap-1">
                                <User className={`w-3 h-3 ${
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
                                disabled={upvotedPosts.has(post.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded font-semibold transition-all duration-300 ${
                                  upvotedPosts.has(post.id)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:scale-110'
                                } ${
                                  darkMode 
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300' 
                                    : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-700'
                                }`}
                              >
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
          )}
        </div>

        <div className={`transition-all duration-500 ${
          activeView === 'post' 
            ? 'opacity-100 translate-x-0' 
            : activeView === 'timeline' 
              ? 'opacity-0 translate-x-full absolute inset-0' 
              : 'opacity-0 -translate-x-full absolute inset-0'
        }`}>
          {activeView === 'post' && (
            <div className="max-w-2xl mx-auto">
              <div className={`rounded-2xl p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 ${
                darkMode 
                  ? 'bg-gradient-to-br from-purple-900/50 to-slate-900/50 border border-purple-500/30' 
                  : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300'
              }`}>
                <h2 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Send className={`w-8 h-8 ${
                    darkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                  Mesaj Bırak
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className={`block mb-2 font-semibold ${
                      darkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      Mesajınız:
                    </label>
                    <div className="relative">
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        className={`w-full h-32 rounded-xl p-4 resize-none transition-all duration-300 focus:ring-4 ${
                          darkMode 
                            ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-400 focus:ring-purple-500/30' 
                            : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500 focus:ring-purple-300/50'
                        } border-2`}
                        placeholder="Duygularınızı, düşüncelerinizi paylaşın..."
                      />
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`absolute bottom-3 right-3 p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                          darkMode 
                            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300' 
                            : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                        }`}
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {showEmojiPicker && (
                      <div className={`mt-2 p-3 rounded-xl border ${
                        darkMode 
                          ? 'bg-slate-800 border-purple-500/30' 
                          : 'bg-white border-purple-200'
                      } grid grid-cols-10 gap-2`}>
                        {EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className={`text-2xl hover:scale-125 transition-transform duration-200 p-1 rounded ${
                              darkMode ? 'hover:bg-purple-500/20' : 'hover:bg-purple-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block mb-2 font-semibold ${
                      darkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      Takma Ad:
                    </label>
                    <input
                      type="text"
                      value={newPost.author}
                      onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                      disabled={newPost.isAnonymous}
                      className={`w-full rounded-xl p-3 transition-all duration-300 focus:ring-4 disabled:opacity-50 ${
                        darkMode 
                          ? 'bg-slate-800/50 border-purple-500/30 text-white focus:ring-purple-500/30' 
                          : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-300/50'
                      } border-2`}
                      placeholder="İsteğe bağlı..."
                    />
                    <label className={`flex items-center gap-2 mt-2 cursor-pointer ${
                      darkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={newPost.isAnonymous}
                        onChange={(e) => setNewPost({...newPost, isAnonymous: e.target.checked})}
                        className="w-4 h-4 rounded"
                      />
                      <span className="font-medium text-sm">Anonim olarak paylaş</span>
                    </label>
                  </div>

                  <div>
                    <label className={`block mb-3 font-semibold flex items-center gap-2 ${
                      darkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      <Calendar className="w-5 h-5" />
                      Zaman Ayarı:
                    </label>
                    <div className="space-y-3">
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
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
                          className="w-4 h-4"
                        />
                        <span className={`font-medium text-sm ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Hemen yayınla
                        </span>
                      </label>
                      
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
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
                          className="w-4 h-4"
                        />
                        <span className={`font-medium text-sm ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Gelecekte yayınla
                        </span>
                      </label>
                      
                      {newPost.postType === 'future' && (
                        <div className="ml-4 space-y-3">
                          <div className="relative">
                            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
                              darkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                            <input
                              type="date"
                              value={newPost.futureDate}
                              onChange={(e) => setNewPost({...newPost, futureDate: e.target.value})}
                              min={new Date().toISOString().split('T')[0]}
                              className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-300 focus:ring-4 ${
                                darkMode 
                                  ? 'bg-slate-800/50 border-purple-500/30 text-white focus:ring-purple-500/30' 
                                  : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-300/50'
                              } border-2`}
                            />
                          </div>
                          <div className="relative">
                            <Clock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
                              darkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                            <input
                              type="time"
                              value={newPost.futureTime}
                              onChange={(e) => setNewPost({...newPost, futureTime: e.target.value})}
                              className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-300 focus:ring-4 ${
                                darkMode 
                                  ? 'bg-slate-800/50 border-purple-500/30 text-white focus:ring-purple-500/30' 
                                  : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-300/50'
                              } border-2`}
                            />
                          </div>
                          <div className="relative">
                            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none ${
                              darkMode ? 'text-purple-400' : 'text-purple-600'
                            }`} />
                            <input
                              type="email"
                              placeholder="E-posta (hatırlatma için)"
                              value={newPost.email}
                              onChange={(e) => setNewPost({...newPost, email: e.target.value})}
                              className={`w-full pl-11 pr-4 py-3 rounded-xl transition-all duration-300 focus:ring-4 ${
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
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 transition-all duration-300 shadow-xl shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
                  >
                    {loading ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main><footer className={`backdrop-blur-xl border-t mt-12 py-8 transition-all duration-300 ${
        darkMode 
          ? 'bg-black/40 border-purple-500/20' 
          : 'bg-white/40 border-purple-300/30'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-3">
            <h3 className={`text-xl font-bold mb-1 bg-gradient-to-r ${
              darkMode 
                ? 'from-purple-400 via-pink-400 to-purple-400' 
                : 'from-purple-600 via-pink-600 to-purple-600'
            } bg-clip-text text-transparent`}>
              {siteInfo.name}
            </h3>
            <p className={`text-xs font-medium ${
              darkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>
              {siteInfo.domain}
            </p>
          </div>
          <p className={`text-sm font-medium mb-1 ${
            darkMode ? 'text-purple-300' : 'text-purple-700'
          }`}>
            {siteInfo.tagline}
          </p>
          <p className={`text-xs mb-4 ${
            darkMode ? 'text-purple-400' : 'text-purple-600'
          }`}>
            {siteInfo.subtitle}
          </p>
          <div className={`pt-3 border-t ${
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