import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Image as ImageIcon, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileChange(files[0]);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('画像をアップロードしてください。');
      return;
    }

    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (!gasUrl) {
      setError('GASのURLが設定されていません。設定メニューから VITE_GAS_URL を追加してください。');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // タイムアウト処理のための AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒でタイムアウト

    try {
      const base64Image = await fileToBase64(image);
      
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q1,
          q2,
          image: base64Image,
          imageName: image.name,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setSubmitted(true);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Submission error:', err);
      if (err.name === 'AbortError') {
        setError('送信がタイムアウトしました。画像サイズを小さくするか、通信環境を確認してください。');
      } else {
        setError('送信中にエラーが発生しました。GASの設定（「全員」に公開されているか）を確認してください。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans p-6 md:p-12 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[24px] shadow-sm border border-black/5 overflow-hidden"
      >
        <div className="p-8 md:p-10">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-2">スケッチ投稿フォーム</h1>
            <p className="text-sm text-[#9e9e9e]">スケッチした建物の情報と画像をアップロードしてください。</p>
          </header>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                {/* Question 1 */}
                <div className="space-y-2">
                  <label htmlFor="q1" className="text-sm font-medium text-[#4a4a4a] block">
                    質問 1: スケッチした建物の名前
                  </label>
                  <input
                    id="q1"
                    type="text"
                    required
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    placeholder="建物名を入力してください"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all bg-white"
                  />
                </div>

                {/* Question 2 */}
                <div className="space-y-2">
                  <label htmlFor="q2" className="text-sm font-medium text-[#4a4a4a] block">
                    質問 2: 建物がある地名
                  </label>
                  <input
                    id="q2"
                    type="text"
                    required
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    placeholder="地名を入力してください"
                    className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 transition-all bg-white"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#4a4a4a] block">
                    画像のアップロード
                  </label>
                  
                  {!previewUrl ? (
                    <div
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3
                        ${isDragging ? 'border-black bg-black/5' : 'border-black/10 hover:border-black/20 hover:bg-black/[0.02]'}
                      `}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center text-[#4a4a4a]">
                        <Upload size={20} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">クリックまたはドラッグ＆ドロップ</p>
                        <p className="text-xs text-[#9e9e9e] mt-1">PNG, JPG, GIF (最大 10MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-black/10 group">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 border border-black/5">
                        <ImageIcon size={14} className="text-[#9e9e9e]" />
                        <span className="text-xs font-medium truncate flex-1">{image?.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-50 text-red-500 text-xs font-medium border border-red-100"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
                    w-full py-4 bg-[#1a1a1a] text-white rounded-xl font-medium transition-all shadow-sm active:scale-[0.98] mt-4 flex items-center justify-center gap-2
                    ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black'}
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      送信中...
                    </>
                  ) : '送信する'}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden"
              >
                {/* Celebration Background Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={`confetti-${i}`}
                      initial={{ opacity: 0, y: 0, x: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        y: [0, -100 - Math.random() * 100],
                        x: [(Math.random() - 0.5) * 200],
                        rotate: [0, Math.random() * 360]
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute top-1/2 left-1/2"
                    >
                      <Sparkles 
                        size={Math.random() * 16 + 8} 
                        className={i % 2 === 0 ? "text-yellow-400" : "text-emerald-400"} 
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                    className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner"
                  >
                    <CheckCircle2 size={48} />
                  </motion.div>
                  
                  {/* Decorative particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1.5, 0],
                        x: Math.cos(i * 45 * Math.PI / 180) * 60,
                        y: Math.sin(i * 45 * Math.PI / 180) * 60
                      }}
                      transition={{ duration: 1, delay: 0.1 }}
                      className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400"
                    />
                  ))}
                </div>

                <div className="space-y-3 relative z-10">
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold tracking-tight text-[#1a1a1a]"
                  >
                    送信完了！
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-[#666] text-sm max-w-[300px] mx-auto leading-relaxed"
                  >
                    スプレッドシートとドライブへの保存が正常に完了しました。<br />ご協力ありがとうございました！
                  </motion.p>
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05, backgroundColor: "#000" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSubmitted(false);
                    setQ1('');
                    setQ2('');
                    removeImage();
                  }}
                  className="px-10 py-4 bg-[#1a1a1a] text-white rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-black/10 flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  続けて投稿する
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
