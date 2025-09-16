'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Dropdown from "./dropdown";

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
    publicationType: string;
    setPublicationType: (value: string) => void;
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
    publicationType,
    setPublicationType,
    additionalAuthors,
    setAdditionalAuthors,
    onSave,
    onBack,
}) => {
    const router = useRouter();
    const publicationTypes = ["Article in journal", "Monograph", "Conference proceedings", "Other"];
    
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

    const validateForm = () => {
        if (!authorName.trim()) {
            alert('Author Name is required');
            return false;
        }
        if (!doi.trim()) {
            alert('DOI is required');
            return false;
        }
        if (!title.trim()) {
            alert('Title is required');
            return false;
        }
        if (!journal.trim()) {
            alert('Journal is required');
            return false;
        }
        if (!date) {
            alert('Published Date is required');
            return false;
        }
        if (!publicationType) {
            alert('Publication Type is required');
            return false;
        }
        
        // Check if any additional author field is empty
        for (let i = 0; i < additionalAuthors.length; i++) {
            if (!additionalAuthors[i].trim()) {
                alert(`Additional Author ${i + 2} cannot be empty`);
                return false;
            }
        }
        
        return true;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave();
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '90vh' }}>
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-center text-xl font-bold mb-4">Paper Details</h1>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="flex flex-col gap-3">
                        <label className="block">
                            <strong>Author Name: <span className="text-red-500">*</span></strong>
                            <input
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                className="w-full p-2 border border-blue-500 rounded mt-1"
                                required
                            />
                        </label>

                        <label className="block">
                            <strong>DOI: <span className="text-red-500">*</span></strong>
                            <input
                                type="text"
                                value={doi}
                                onChange={(e) => setDoi(e.target.value)}
                                className="w-full p-2 border border-blue-500 rounded mt-1"
                                required
                            />
                        </label>

                        <label className="block">
                            <strong>Title: <span className="text-red-500">*</span></strong>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full p-2 border border-blue-500 rounded mt-1"
                                required
                            />
                        </label>

                        <label className="block">
                            <strong>Journal: <span className="text-red-500">*</span></strong>
                            <input
                                type="text"
                                value={journal}
                                onChange={(e) => setJournal(e.target.value)}
                                className="w-full p-2 border border-blue-500 rounded mt-1"
                                required
                            />
                        </label>

                        <label className="block">
                            <strong>Published Date: <span className="text-red-500">*</span></strong>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full p-2 border border-blue-500 rounded mt-1"
                                required
                            />
                        </label>

                        <label className="block">
                            <strong>Publication Type: <span className="text-red-500">*</span></strong>
                            <Dropdown
                              options={publicationTypes}
                              value={publicationType}
                              onChange={setPublicationType}
                              placeholder='Select publication type'
                              required
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
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAuthor(index)}
                                        className="bg-red-500 text-white px-2 py-1 rounded-full text-lg"
                                    >
                                        −
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addAuthor}
                                className="mt-2 bg-green-500 text-white px-2 py-1 rounded-full text-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between mt-5">
                        <button 
                            type="button"
                            onClick={onBack} 
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Back
                        </button>

                        <button 
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaperForm;