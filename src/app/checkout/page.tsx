'use client';

import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import {
  setCustomerForOrder,
  setOrderShippingAddress,
  setShippingMethod,
  addPaymentToOrder,
  transitionOrderToState,
  getEligibleShippingMethods,
  getEligiblePaymentMethods,
  ShippingMethod,
  PaymentMethod,
} from '@/lib/vendure';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'VN',
  });

  const [formFields, setFormFields] = useState({
    customerInfo: false,
    shippingAddress: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchMethods = async () => {
    if (isFetching) return;
    
    try {
      setIsFetching(true);
      console.log('Bắt đầu quy trình thanh toán...');

      if (cart.length === 0) {
        throw new Error('Giỏ hàng trống');
      }
      console.log('Giỏ hàng:', cart);

      console.log('Chuyển trạng thái đơn hàng...');
      const transitionResponse = await transitionOrderToState('ArrangingPayment');
      console.log('Kết quả chuyển trạng thái:', transitionResponse);

      if (!transitionResponse?.data?.transitionOrderToState) {
        throw new Error('Không thể chuyển trạng thái đơn hàng');
      }

      console.log('Thiết lập thông tin khách hàng...');
      const customerResponse = await setCustomerForOrder({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.emailAddress,
        phoneNumber: formData.phoneNumber,
      });
      console.log('Kết quả thiết lập khách hàng:', customerResponse);

      if (!customerResponse?.data?.setCustomerForOrder) {
        throw new Error('Không thể thiết lập thông tin khách hàng');
      }

      console.log('Thiết lập địa chỉ giao hàng...');
      const addressResponse = await setOrderShippingAddress({
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetLine1: formData.streetLine1,
        streetLine2: formData.streetLine2,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        countryCode: formData.country,
        phoneNumber: formData.phoneNumber,
      });
      console.log('Kết quả set địa chỉ:', addressResponse);

      if (!addressResponse?.data?.setOrderShippingAddress) {
        throw new Error('Không thể thiết lập địa chỉ giao hàng');
      }

      console.log('Lấy danh sách phương thức vận chuyển...');
      const shippingResponse = await getEligibleShippingMethods();
      console.log('Kết quả phương thức vận chuyển:', shippingResponse);
      
      if (!shippingResponse?.data?.eligibleShippingMethods) {
        throw new Error('Không thể lấy danh sách phương thức vận chuyển');
      }

      const shippingMethods = shippingResponse.data.eligibleShippingMethods;
      if (!Array.isArray(shippingMethods) || shippingMethods.length === 0) {
        throw new Error('Không có phương thức vận chuyển nào khả dụng cho địa chỉ này');
      }

      setShippingMethods(shippingMethods);
      const defaultShippingMethod = shippingMethods[0].id;
      setSelectedShippingMethod(defaultShippingMethod);
      
      console.log('Thiết lập phương thức vận chuyển...');
      const setShippingResponse = await setShippingMethod(defaultShippingMethod);
      console.log('Kết quả thiết lập vận chuyển:', setShippingResponse);

      if (!setShippingResponse?.data?.setOrderShippingMethod) {
        throw new Error('Không thể thiết lập phương thức vận chuyển');
      }

      console.log('Lấy danh sách phương thức thanh toán...');
      const paymentResponse = await getEligiblePaymentMethods();
      console.log('Kết quả phương thức thanh toán:', paymentResponse);
      
      if (!paymentResponse?.data?.eligiblePaymentMethods) {
        throw new Error('Không thể lấy danh sách phương thức thanh toán');
      }

      const paymentMethods = paymentResponse.data.eligiblePaymentMethods;
      if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
        throw new Error('Không có phương thức thanh toán nào khả dụng');
      }

      setPaymentMethods(paymentMethods);
      setSelectedPaymentMethod(paymentMethods[0].code);
    } catch (err) {
      console.error('Lỗi trong quá trình thanh toán:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình thanh toán');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const hasCustomerInfo = formData.firstName && formData.lastName && 
                          formData.emailAddress && formData.phoneNumber;
    const hasShippingAddress = formData.streetLine1 && formData.city && formData.province;
    
    setFormFields({
      customerInfo: !!hasCustomerInfo,
      shippingAddress: !!hasShippingAddress
    });
  }, [formData]);

  useEffect(() => {
    if (formFields.customerInfo && formFields.shippingAddress) {
      fetchMethods();
    }
  }, [formFields]);

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-gray-600 mb-4">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
        <a href="/" className="text-indigo-600 hover:text-indigo-700">
          Quay lại trang chủ
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Thiết lập thông tin khách hàng...');
      const customerResponse = await setCustomerForOrder({
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.emailAddress,
        phoneNumber: formData.phoneNumber,
      });
      console.log('Kết quả thiết lập khách hàng:', customerResponse);

      if (!customerResponse?.data?.setCustomerForOrder) {
        throw new Error('Không thể thiết lập thông tin khách hàng');
      }

      console.log('Thiết lập địa chỉ giao hàng...');
      const addressResponse = await setOrderShippingAddress({
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetLine1: formData.streetLine1,
        streetLine2: formData.streetLine2,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        countryCode: formData.country,
        phoneNumber: formData.phoneNumber,
      });
      console.log('Kết quả set địa chỉ:', addressResponse);

      if (!addressResponse?.data?.setOrderShippingAddress) {
        throw new Error('Không thể thiết lập địa chỉ giao hàng');
      }

      console.log('Thiết lập phương thức vận chuyển...');
      if (!selectedShippingMethod) {
        throw new Error('Vui lòng chọn phương thức vận chuyển');
      }

      const shippingResponse = await setShippingMethod(selectedShippingMethod);
      console.log('Kết quả thiết lập vận chuyển:', shippingResponse);

      if (!shippingResponse?.data?.setOrderShippingMethod) {
        throw new Error('Không thể thiết lập phương thức vận chuyển');
      }

      console.log('Thêm thanh toán...');
      if (!selectedPaymentMethod) {
        throw new Error('Vui lòng chọn phương thức thanh toán');
      }

      const paymentResponse = await addPaymentToOrder({
        method: selectedPaymentMethod,
        metadata: {
          note: 'Thanh toán đơn hàng'
        }
      });
      console.log('Kết quả thêm thanh toán:', paymentResponse);

      if (!paymentResponse?.data?.addPaymentToOrder) {
        throw new Error('Không thể thêm thanh toán');
      }

      console.log('Chuyển trạng thái đơn hàng...');
      const transitionResponse = await transitionOrderToState('PaymentSettled');
      console.log('Kết quả chuyển trạng thái:', transitionResponse);

      if (!transitionResponse?.data?.transitionOrderToState) {
        throw new Error('Không thể chuyển trạng thái đơn hàng');
      }

      window.location.href = '/thank-you';
    } catch (err) {
      console.error('Lỗi trong quá trình thanh toán:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra trong quá trình thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Họ
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Tên
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Địa chỉ giao hàng</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="streetLine1" className="block text-sm font-medium text-gray-700">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  id="streetLine1"
                  name="streetLine1"
                  value={formData.streetLine1}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="streetLine2" className="block text-sm font-medium text-gray-700">
                  Địa chỉ phụ (tùy chọn)
                </label>
                <input
                  type="text"
                  id="streetLine2"
                  name="streetLine2"
                  value={formData.streetLine2}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Thành phố
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                  Tỉnh/Thành phố
                </label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  Mã bưu điện
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Phương thức vận chuyển</h2>
          {shippingMethods.length > 0 ? (
            <div className="space-y-4">
              {shippingMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`shipping-${method.id}`}
                      name="shippingMethod"
                      value={method.id}
                      checked={selectedShippingMethod === method.id}
                      onChange={(e) => setSelectedShippingMethod(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <label htmlFor={`shipping-${method.id}`} className="block text-sm font-medium text-gray-700">
                        {method.name}
                      </label>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice(method.priceWithTax)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Đang tải phương thức vận chuyển...</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
          {paymentMethods.length > 0 ? (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    id={`payment-${method.id}`}
                    name="paymentMethod"
                    value={method.code}
                    checked={selectedPaymentMethod === method.code}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <label htmlFor={`payment-${method.id}`} className="block text-sm font-medium text-gray-700">
                      {method.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Đang tải phương thức thanh toán...</p>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Tổng đơn hàng</h2>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.productVariant.name} x {item.quantity}
                </span>
                <span>
                  {formatPrice(
                    item.productVariant.priceWithTax * item.quantity,
                    item.productVariant.currencyCode
                  )}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 font-semibold">
              <div className="flex justify-between">
                <span>Tổng cộng:</span>
                <span>
                  {formatPrice(
                    cart.reduce(
                      (total, item) => total + item.productVariant.priceWithTax * item.quantity,
                      0
                    ),
                    cart[0]?.productVariant.currencyCode || 'VND'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !selectedShippingMethod || !selectedPaymentMethod}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </div>
      </form>
    </div>
  );
} 