// src/components/OrderItem.js
import React from 'react';
import { resolveProductImage } from '../utils/dairyImageResolver';

const OrderItem = ({ orderItem }) => {
    return (
        <div className="flex items-center p-4 bg-gray-100 rounded-lg shadow-sm">
            <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md border border-gray-200">
                <img src={resolveProductImage(orderItem.product, 0)} alt={orderItem.name} className="w-full h-full object-cover object-center" />
            </div>
            <div className="ml-4 flex-1">
                <div className="flex justify-between text-base font-medium text-gray-900">
                    <h3>
                        {orderItem.name}
                        {orderItem.product?.isActive === false && (
                            <span className="text-red-500 text-xs ml-2 font-bold">(Deactivated)</span>
                        )}
                    </h3>
                    <p>₹{orderItem.price}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">Qty: {orderItem.qty}</p>
            </div>
        </div>
    );
};

export default OrderItem;