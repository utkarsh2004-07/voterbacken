import React, { useState, useRef, useEffect } from 'react';
import { Search, Printer } from 'lucide-react';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const PrintableSlip = React.memo(React.forwardRef(({ user }, ref) => {
    return (
        <div ref={ref} className="p-2 bg-white rounded-lg shadow-lg" style={{ width: '400px', height: '200px' }}>
            <div className="flex flex-col items-center space-y-2">
                <img src="https://placehold.co/600x400" alt="image" style={{ maxWidth: '100%', height: 'auto' }} />
                <h2 className="text-xl font-bold text-gray-800">{user.FullName}</h2>
                <div className="w-full space-y-1">
                    <p className="text-gray-600">Srno: {user.srno}</p>
                    <p className="text-gray-600">Age: {user.Age}</p>
                    <p className="text-gray-600">Sex: {user.Sex}</p>
                    <p className="text-gray-600">Card No: {user.CardNo}</p>
                    <p className="text-gray-600">Boot No: {user.Boot}</p>
                    {user.MobileNumber && <p className="text-gray-600">Mobile No: {user.MobileNumber}</p>}
                </div>
            </div>
        </div>
    );
}));

const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [bootNoFilter, setBootNoFilter] = useState('001 Z. P. School, Room No. 1, Chikhal Dongri');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const componentRefs = useRef({});
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [users, setUsers] = useState([]);
    const [newMobileNumber, setNewMobileNumber] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [inputVisible, setInputVisible] = useState({}); // Track input visibility
    const [modalVisible, setModalVisible] = useState(false); // Modal visibility
    const [currentUserId, setCurrentUserId] = useState(null); // Store current user ID for mobile input
    const resultsPerPage = 5;

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:5000/api/users');
            const data = await response.json();
            setUsers(data);
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        if (debouncedSearchTerm) {
            const results = users.filter(user =>
                user.Boot === bootNoFilter &&
                (user.FullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    user.CardNo.toString() === debouncedSearchTerm)
            );
            setFilteredUsers(results);
            setCurrentPage(1);
        } else {
            setFilteredUsers([]);
        }
    }, [debouncedSearchTerm, bootNoFilter, users]);

    const handleAddMobile = async () => {
        if (newMobileNumber && currentUserId) {
            const response = await fetch(`http://localhost:5000/api/users/${currentUserId}/add-mobile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MobileNumber: newMobileNumber }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUsers((prevUsers) => prevUsers.map(user => (user._id === updatedUser._id ? updatedUser : user)));
                setNewMobileNumber('');
                setModalVisible(false); // Close modal after submission
            } else {
                console.error('Failed to update mobile number');
            }
        }
    };

    const handlePrint = (user) => {
        const printContent = componentRefs.current[user._id];
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            const content = printContent.innerHTML;
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${user.FullName} - Slip</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .container { text-align: center; }
                            img { max-width: 100%; height: auto; }
                        </style>
                    </head>
                    <body>
                        <div class="container">${content}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const totalResults = filteredUsers.length;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    const startIndex = (currentPage - 1) * resultsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + resultsPerPage);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users by Full Name or Card number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentUsers.length > 0 ? (
                    currentUsers.map(user => (
                        <div key={user._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden text-center">
                            <div className="p-6">
                                <h2 className="mt-4 text-xl font-bold text-gray-800">{user.FullName}</h2>
                                <div className="mt-4 w-full space-y-2">
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded">
                                        <span className="text-gray-600 font-medium">Age:</span>
                                        <span className="text-gray-800">{user.Age}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded">
                                        <span className="text-gray-600 font-medium">Sex:</span>
                                        <span className="text-gray-800">{user.Sex}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded">
                                        <span className="text-gray-600 font-medium">Card No:</span>
                                        <span className="text-gray-800">{user.CardNo}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded">
                                        <span className="text-gray-600 font-medium">Boot No:</span>
                                        <span className="text-gray-800">{user.Boot}</span>
                                    </div>
                                    {user.MobileNumber ? (
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded">
                                            <span className="text-gray-600 font-medium">Mobile No:</span>
                                            <span className="text-gray-800">{user.MobileNumber}</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setModalVisible(true);
                                                setCurrentUserId(user._id);
                                            }}
                                            className="text-blue-500"
                                        >
                                            Add Mobile Number
                                        </button>
                                    )}
                                </div>
                                <div className="mt-6 flex space-x-4">
                                    <button
                                        onClick={() => handlePrint(user)}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 ease-in-out"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        Print
                                    </button>
                                </div>
                            </div>
                            <div className="hidden">
                                <div ref={el => componentRefs.current[user._id] = el}>
                                    <PrintableSlip user={user} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <div className="inline-block p-6 bg-white rounded-lg shadow">
                            <p className="text-gray-500 text-lg">
                                No results found for "{debouncedSearchTerm}"
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Adding Mobile Number */}
            {modalVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-lg font-bold mb-4">Add Mobile Number</h2>
                        <input
                            type="text"
                            value={newMobileNumber}
                            onChange={(e) => setNewMobileNumber(e.target.value)}
                            placeholder="Enter Mobile Number"
                            className="border p-2 rounded w-full mb-4"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setModalVisible(false);
                                    setNewMobileNumber(''); // Clear input
                                }}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMobile}
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="self-center">{`Page ${currentPage} of ${totalPages}`}</span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
