"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { format } from 'date-fns';
import { combineDateAndTime, localToUTC, isInPast, getTimezoneDisplay } from '@/utils/timezone-helpers';
import 'react-international-phone/style.css';

interface TaskSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date | null;
    onSubmit: (data: TaskFormData) => Promise<void>;
}

export interface TaskFormData {
    name: string;
    mobileNumber: string;
    time: string;
    task: string;
    notificationTimes: string[];
}

const phoneUtil = PhoneNumberUtil.getInstance();

const notificationOptions = [
    { id: '1hour', label: '1 Hour' },
    { id: '1day', label: '1 Day' },
    { id: '1week', label: '1 Week' },
] as const;

const isPhoneValid = (phone: string) => {
    try {
        return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
    } catch {
        return false;
    }
};
export function TaskSchedulerModal({
    isOpen,
    onClose,
    selectedDate,
    onSubmit
}: TaskSchedulerModalProps) {
    const [formData, setFormData] = useState<TaskFormData>({
        name: '',
        mobileNumber: '',
        time: '',
        task: '',
        notificationTimes: []
    });
    const [loading, setLoading] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    if (!isOpen || !selectedDate) return null;

    const handlePhoneChange = (phone: string) => {
        setFormData({ ...formData, mobileNumber: phone });

        // Validate phone number
        if (phone && !isPhoneValid(phone)) {
            setPhoneError('Please enter a valid phone number');
        } else {
            setPhoneError('');
        }
    };

    const handleCheckboxChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        notificationId: string
    ): void => {
        const isChecked = e.target.checked;

        setFormData(prevData => {
            let updatedNotifications: string[];

            if (isChecked) {
                // Add to array if checked
                updatedNotifications = [...prevData.notificationTimes, notificationId];
            } else {
                // Remove from array if unchecked
                updatedNotifications = prevData.notificationTimes.filter(
                    id => id !== notificationId
                );
            }

            return {
                ...prevData,
                notificationTimes: updatedNotifications
            };
        });
    };

    const handleClose = () => {
        setFormData({
            name: '',
            mobileNumber: '',
            time: '',
            task: '',
            notificationTimes: [],
        });
        setPhoneError('');
        onClose();
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        console.log(formData);
        if (!selectedDate) {
            alert('Invalid date selected');
            return;
        }

        // Final phone validation before submit
        if (!isPhoneValid(formData.mobileNumber)) {
            setPhoneError('Please enter a valid phone number');
            return;
        }

        // Validate notification times
        if (formData.notificationTimes.length === 0) {
            alert('Please select at least one notification time');
            return;
        }

        // Combine selectedDate and formData.time in user's local timezone
        const combinedDate = combineDateAndTime(selectedDate, formData.time);

        // Validate that the combined date/time is in the future
        if (isInPast(combinedDate)) {
            alert(`Please select a future time. The selected time (${combinedDate.toLocaleString()}) has already passed.`);
            return;
        }

        // Convert to UTC ISO string for storage
        const dateTimeISO = localToUTC(combinedDate);
        console.log('Local time:', combinedDate.toLocaleString());
        console.log('UTC time (stored):', dateTimeISO);
        console.log('User timezone:', getTimezoneDisplay());
        try {
            setLoading(true);
            await onSubmit({
                ...formData,
                time: dateTimeISO,
            });
            handleClose();
        } catch (error) {
            console.error('Failed to schedule task:', error);
            alert('Failed to schedule task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const isFormValid =
        formData.name &&
        formData.mobileNumber &&
        formData.time &&
        formData.task &&
        formData.notificationTimes.length > 0 &&
        isPhoneValid(formData.mobileNumber);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Schedule Task Reminder
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-between space-y-1 mb-4">
                    <p className="text-sm text-gray-600">
                        Date: <span className="font-medium">{format(selectedDate, 'MMMM dd, yyyy')}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Timezone: <span className="font-medium">{getTimezoneDisplay()}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter name"
                        />
                    </div>

                    {/* Phone Number Field with react-international-phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                            defaultCountry="in"
                            value={formData.mobileNumber}
                            onChange={handlePhoneChange}
                            inputClassName="w-full"
                            className="w-full"
                            style={{
                                '--react-international-phone-height': '42px',
                                '--react-international-phone-border-radius': '6px',
                                '--react-international-phone-background-color': '#ffffff',
                                '--react-international-phone-country-selector-button__button-content': 'px-2'
                            } as React.CSSProperties}
                        />
                        {phoneError && (
                            <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                        )}
                        {formData.mobileNumber && !phoneError && (
                            <p className="mt-1 text-sm text-green-600">Valid phone number</p>
                        )}
                    </div>

                    {/* Time Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            required
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Task Description Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.task}
                            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Describe the task..."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.task.length} characters
                        </p>
                    </div>

                    {/* Notification Timing Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notify Before <span className="text-red-500">*</span>
                        </label>
                        <div className="flex justify-between items-center gap-5">
                            {notificationOptions.map((option) => (
                                <div key={option.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={option.id}
                                        checked={formData.notificationTimes.includes(option.id)}
                                        onChange={(e) => handleCheckboxChange(e, option.id)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor={option.id}
                                        className="ml-2 text-sm text-gray-700 cursor-pointer"
                                    >
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {formData.notificationTimes.length === 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                                Select at least one notification time
                            </p>
                        )}
                        {formData.notificationTimes.length > 0 && (
                            <p className="mt-1 text-xs text-green-600">
                                ✓ {formData.notificationTimes.length} notification(s) selected
                            </p>
                        )}
                    </div>


                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                    Scheduling...
                                </span>
                            ) : (
                                'Schedule Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}