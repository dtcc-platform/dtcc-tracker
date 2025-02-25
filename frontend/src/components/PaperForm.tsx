'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface PaperFormProps {
    authorName: string;
    setAuthorName: (value: string) => void;
    doi: string;
    setDoi: (value: string) => void;
    title: string;
    setTitle: (value: string) => void;
    journal: string;
    setJournal: (value: string) => void;
    date: string;
    setDate: (value: string) => void;
    additionalAuthors: string[];
    setAdditionalAuthors: (value: string[]) => void;
    onSave: () => void;
    onBack: () => void;
}

const PaperForm: React.FC<PaperFormProps> = ({
    authorName,
    setAuthorName,
    doi,
    setDoi,
    title,
    setTitle,
    journal,
    setJournal,
    date,
    setDate,
    additionalAuthors,
    setAdditionalAuthors,
    onSave,
    onBack,
}) => {
    const router = useRouter();

    const addAuthor = () => {
        setAdditionalAuthors([...additionalAuthors, '']);
    };

    const removeAuthor = (index: number) => {
        const updatedAuthors = additionalAuthors.filter((_, i) => i !== index);
        setAdditionalAuthors(updatedAuthors);
    };

    const handleAuthorChange = (index: number, value: string) => {
        const updatedAuthors = [...additionalAuthors];
        updatedAuthors[index] = value;
        setAdditionalAuthors(updatedAuthors);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-center text-xl font-bold mb-4">Paper Details</h1>

                <div className="flex flex-col gap-3">
                    <label className="block">
                        <strong>Author Name:</strong>
                        <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    <label className="block">
                        <strong>DOI:</strong>
                        <input
                            type="text"
                            value={doi}
                            onChange={(e) => setDoi(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    <label className="block">
                        <strong>Title:</strong>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    <label className="block">
                        <strong>Journal:</strong>
                        <input
                            type="text"
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    <label className="block">
                        <strong>Published Date:</strong>
                        <input
                            type="text"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    {/* Additional Authors */}
                    <div>
                        <strong>Additional Authors:</strong>
                        {additionalAuthors.map((author, index) => (
                            <div key={index} className="flex items-center mt-2 space-x-2">
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => handleAuthorChange(index, e.target.value)}
                                    className="w-full p-2 border border-blue-500 rounded"
                                    placeholder={`Author ${index + 2}`}
                                />
                                <button
                                    onClick={() => removeAuthor(index)}
                                    className="bg-red-500 text-white px-2 py-1 rounded-full text-lg"
                                >
                                    −
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addAuthor}
                            className="mt-2 bg-green-500 text-white px-2 py-1 rounded-full text-lg"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="flex justify-between mt-5">
                    <button onClick={onBack} className="bg-gray-500 text-white px-4 py-2 rounded">
                        Back
                    </button>

                    <button onClick={onSave} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaperForm;
