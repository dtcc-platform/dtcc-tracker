'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Dropdown from './dropdown';

interface PaperFormProps {
    Pi: string;
    setPi: (value: string) => void;
    ProjectName: string;
    setProjectName: (value: string) => void;
    status: string;
    setStatus: (value: string) => void;
    statuses: string[]
    fundingBody: string
    setFundingBody:(value: string) => void;
    fundingbdytypes: string[]
    additionalAuthors: string[];
    setAdditionalAuthors: (value: string[]) => void;
    Documents: string
    setDocuments: (value: string) => void;
    onSave: () => void;
    onBack: () => void;
}

const PaperForm: React.FC<PaperFormProps> = ({
    Pi,
    setPi,
    ProjectName,
    setProjectName,
    status,
    setStatus,
    statuses,
    fundingBody,
    setFundingBody,
    fundingbdytypes,
    additionalAuthors,
    setAdditionalAuthors,
    Documents,
    setDocuments,
    onBack,
    onSave
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
                        <strong>PI*:</strong>
                        <input
                            type="text"
                            value={Pi}
                            onChange={(e) => setPi(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    <label className="block">
                        <strong>Project Name*:</strong>
                        <input
                            type="text"
                            value={ProjectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>
                    <label className="block">
                        <strong>Documents Link:</strong>
                        <input
                            type="text"
                            value={Documents}
                            onChange={(e) => setDocuments(e.target.value)}
                            className="w-full p-2 border border-blue-500 rounded mt-1"
                        />
                    </label>

                    <label className="block">
                        <strong>Status:</strong>
                        <Dropdown
                          options={statuses}
                          value={status}
                          onChange={setStatus}
                          placeholder='Select Status'
                        />
                    </label>

                    <label className="block">
                        <strong>Funding Body:</strong>
                        <Dropdown
                          options={fundingbdytypes}
                          value={fundingBody}
                          onChange={setFundingBody}
                          placeholder='Select Funding Body'
                        />
                    </label>

                    

                    {/* Additional Authors */}
                    <div>
                        <strong>Collaborators:</strong>
                        {additionalAuthors.map((author, index) => (
                            <div key={index} className="flex items-center mt-2 space-x-2">
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => handleAuthorChange(index, e.target.value)}
                                    className="w-full p-2 border border-blue-500 rounded"
                                    placeholder={`Person ${index + 2}`}
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
