'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    // Tự động chuyển hướng về trang chủ sau 5 giây
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Cảm ơn bạn đã mua hàng!</h1>
        <p className="text-lg text-gray-600 mb-6">
          Đơn hàng của bạn đã được xử lý thành công. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
        </p>
        <p className="text-sm text-gray-500">
          Bạn sẽ được chuyển hướng về trang chủ trong 5 giây...
        </p>
        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
} 