'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Author {
    first_name: string;
    last_name: string;
}

const ResultPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [journal, setJournal] = useState(searchParams.get('journal') || 'N/A');
    const [doi, setDoi] = useState(searchParams.get('doi') || 'N/A');
    const [title, setTitle] = useState(searchParams.get('title') || 'N/A');
    const [publishedOn, setPublishedOn] = useState(searchParams.get('publishedOn') || 'N/A');
    const [publisher, setPublisher] = useState(searchParams.get('publisher') || 'N/A');

    const authorsInput = searchParams.get('authors');
    const parsedAuthors = authorsInput
        ? JSON.parse(authorsInput)
        : { "Main Author": { first_name: 'N/A', last_name: 'N/A' }, "Additional Authors": [] };

    const [mainAuthor, setMainAuthor] = useState(parsedAuthors["Main Author"]);
    const [additionalAuthors, setAdditionalAuthors] = useState(parsedAuthors["Additional Authors"]);

    const handleAuthorChange = (index: number, key: string, value: string) => {
        const updatedAuthors = [...additionalAuthors];
        updatedAuthors[index] = { ...updatedAuthors[index], [key]: value };
        setAdditionalAuthors(updatedAuthors);
    };

    const handleMainAuthorChange = (key: string, value: string) => {
        setMainAuthor({ ...mainAuthor, [key]: value });
    };

    const handleBack = () => {
        router.push('/');
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5',
                padding: '20px',
            }}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxWidth: '400px',
                    width: '100%',
                }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Result</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        <strong>Journal:</strong>
                        <input
                            type="text"
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '5px',
                                border: '2px solid #3498db',
                                borderRadius: '4px',
                                marginTop: '5px',
                            }}
                        />
                    </div>
                    <div>
                        <strong>DOI:</strong>
                        <input
                            type="text"
                            value={doi}
                            onChange={(e) => setDoi(e.target.value)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '5px',
                                border: '2px solid #3498db',
                                borderRadius: '4px',
                                marginTop: '5px',
                            }}
                        />
                    </div>
                    <div>
                        <strong>Title:</strong>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '5px',
                                border: '2px solid #3498db',
                                borderRadius: '4px',
                                marginTop: '5px',
                            }}
                        />
                    </div>
                    <div>
                        <strong>Published On:</strong>
                        <input
                            type="text"
                            value={publishedOn}
                            onChange={(e) => setPublishedOn(e.target.value)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '5px',
                                border: '2px solid #3498db',
                                borderRadius: '4px',
                                marginTop: '5px',
                            }}
                        />
                    </div>
                    <div>
                        <strong>Publisher:</strong>
                        <input
                            type="text"
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '5px',
                                border: '2px solid #3498db',
                                borderRadius: '4px',
                                marginTop: '5px',
                            }}
                        />
                    </div>
                    <div>
                        <strong>Main Author:</strong>
                        <div>
                            <input
                                type="text"
                                value={mainAuthor.first_name}
                                onChange={(e) => handleMainAuthorChange('first_name', e.target.value)}
                                placeholder="First Name"
                                style={{
                                    marginRight: '10px',
                                    padding: '5px',
                                    border: '2px solid #3498db',
                                    borderRadius: '4px',
                                }}
                            />
                            <input
                                type="text"
                                value={mainAuthor.last_name}
                                onChange={(e) => handleMainAuthorChange('last_name', e.target.value)}
                                placeholder="Last Name"
                                style={{
                                    padding: '5px',
                                    border: '2px solid #3498db',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <strong>Additional Authors:</strong>
                        {additionalAuthors.map((author: Author, index: number) => (
                            <div key={index} style={{ marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    value={author.first_name}
                                    onChange={(e) => handleAuthorChange(index, 'first_name', e.target.value)}
                                    placeholder="First Name"
                                    style={{
                                        marginRight: '10px',
                                        padding: '5px',
                                        border: '2px solid #3498db',
                                        borderRadius: '4px',
                                    }}
                                />
                                <input
                                    type="text"
                                    value={author.last_name}
                                    onChange={(e) => handleAuthorChange(index, 'last_name', e.target.value)}
                                    placeholder="Last Name"
                                    style={{
                                        padding: '5px',
                                        border: '2px solid #3498db',
                                        borderRadius: '4px',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleBack}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '20px',
                    }}
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default ResultPage;
