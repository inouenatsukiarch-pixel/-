import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, Image as ImageIcon, Sparkles, Plus, Loader2, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageData {
  id: string;
  file: File;
  preview: string;
}

export default function App() {
  const [images, setImages] = useState<ImageData[]>([]);
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

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      const newImages: ImageData[] = newFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file: file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('画像をアップロードしてください。');
      return;
    }

    const gasUrl = import.meta.env.VITE_GAS_URL;
    console.log('GAS URL:', gasUrl); // デバッグ用

    if (!gasUrl || gasUrl.includes('YOUR_GAS_URL')) {
      setError('GASのURLが正しく設定されていません。Settingsメニューを確認してください。');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('画像データの変換を開始...');
      const imageDataArray = await Promise.all(
        images.map(async (img) => ({
          image: await fileToBase64(img.file),
          imageName: img.file.name
        }))
      );

      console.log(`${imageDataArray.length}枚の画像を送信中...`);

      // GASへの送信 (no-corsモード)
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageDataArray
        }),
      });

      console.log('送信リクエスト完了');
      // no-corsの場合、成功したかどうかは判定できないため、リクエストが完了したら成功とみなす
      setSubmitted(true);
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
    } catch (err: any) {
      console.error('Submission error details:', err);
      setError(`送信中にエラーが発生しました: ${err.message || '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex items-center justify-center relative overflow-hidden">
      {/* Decorative floating blobs for glass effect depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass rounded-[40px] overflow-hidden relative z-10"
      >
        <div className="p-8 md:p-12">
          <header className="mb-10 text-center">
            <div className="inline-block p-3 rounded-2xl bg-white/50 mb-4 shadow-inner">
              <Ruler className="text-gray-700 w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
              スケッチ投稿フォーム
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              スケッチの画像をアップロードしてください。<br />
              <span className="font-medium text-gray-800">建物の名前、地名、描いた年、年齢</span>をスケッチ内に記入してください。
            </p>
          </header>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                {/* Image Upload Area */}
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-button rounded-[32px] p-10 text-center cursor-pointer group transition-all duration-500 hover:shadow-lg hover:border-white/80"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onFileSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center text-gray-400 mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500">
                      <Plus size={28} className="text-gray-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">画像を追加する</p>
                    <p className="text-xs text-gray-500 mt-1">複数選択可能です</p>
                  </div>

                  {/* Preview Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                      {images.map((img) => (
                        <motion.div
                          key={img.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-3xl overflow-hidden border border-white/60 shadow-md group"
                        >
                          <img
                            src={img.preview}
                            alt="preview"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="p-3 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-all shadow-xl"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm text-red-600 text-xs font-medium border border-red-100 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || images.length === 0}
                  className={`
                    w-full py-5 rounded-[32px] font-bold text-sm tracking-widest uppercase transition-all duration-500 relative overflow-hidden group
                    ${isSubmitting || images.length === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0'}
                  `}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        送信中...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        スケッチを送信
                      </>
                    )}
                  </span>
                  {!isSubmitting && images.length > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.1, 1] }}
                    className="w-28 h-28 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-emerald-500 shadow-2xl border border-white"
                  >
                    <CheckCircle2 size={56} strokeWidth={1.5} />
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300 rounded-full blur-xl opacity-50 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-gray-900">送信完了！</h2>
                  <p className="text-gray-600 text-sm max-w-[280px] mx-auto leading-relaxed">
                    スケッチが美しく保存されました。<br />
                    ご協力に心より感謝いたします。
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSubmitted(false)}
                  className="px-12 py-4 glass-button rounded-full text-sm font-bold text-gray-800 shadow-lg"
                >
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
