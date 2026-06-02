// src/components/LiveLocationTracker.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const LiveLocationTracker = () => {
    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [status, setStatus] = useState('Waiting for location...');
    const [, setUser] = useState(null);

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        setUser(currentUser);

        if (!currentUser || currentUser.role !== 'delivery') {
            setStatus('You must be a delivery partner to use this feature.');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
                setStatus('Tracking your location...');

                // Send the location to the backend via Socket.IO
                socket.emit('update-location', {
                    deliveryPersonId: currentUser.id,
                    latitude,
                    longitude,
                });
            },
            (error) => {
                setStatus(`Geolocation error: ${error.message}`);
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-800">Live Location Tracker</h2>
            <p className="text-gray-600 mb-2 text-sm md:text-base">{status}</p>
            {location.latitude && location.longitude && (
                <div className="mt-4 space-y-1">
                    <p className="text-sm md:text-base"><strong>Latitude:</strong> {location.latitude}</p>
                    <p className="text-sm md:text-base"><strong>Longitude:</strong> {location.longitude}</p>
                    <div className="h-64 bg-gray-100 rounded-xl mt-4 flex items-center justify-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-[13px] md:text-sm italic">Map view will be displayed here.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveLocationTracker;