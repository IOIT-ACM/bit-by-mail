import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Recipient } from '../types';

interface RecipientTableProps {
  sendMessage: (action: string, payload?: any) => void;
}

const RecipientTable: React.FC<RecipientTableProps> = ({ sendMessage }) => {
  const { recipients, updateRecipient } = useAppStore();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      if (recipients.length > 0) {
        console.log('Autosaving recipients...');
        sendMessage('save_recipients', recipients);
      }
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [recipients, sendMessage]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const base64Content = btoa(text);
        sendMessage('upload_recipients', base64Content);
      };
      reader.readAsText(file);
    }
  };

  const handleCellChange = (index: number, field: keyof Recipient, value: string) => {
    const recipient = recipients[index];
    const updatedRecipient = { ...recipient, [field]: value };
    updateRecipient(index, updatedRecipient);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SENT': return 'text-green-600';
      case 'ERROR': return 'text-red-600';
      case 'SKIPPED': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recipients (Changes save automatically)</h2>
        <input type="file" id="csv-upload" accept=".csv" onChange={handleFileUpload} className="hidden" />
        <label htmlFor="csv-upload" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
		Upload data
        </label>
      </div>
      <div className="overflow-auto flex-grow" style={{ maxHeight: '400px' }}>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-2">Name</th>
              <th scope="col" className="px-4 py-2">Email</th>
              <th scope="col" className="px-4 py-2">Attachment File</th>
              <th scope="col" className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((recipient, index) => (
              <tr key={index} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-2"><input type="text" value={recipient.Name} onChange={(e) => handleCellChange(index, 'Name', e.target.value)} className="bg-transparent w-full outline-none" /></td>
                <td className="px-4 py-2"><input type="text" value={recipient.Email} onChange={(e) => handleCellChange(index, 'Email', e.target.value)} className="bg-transparent w-full outline-none" /></td>
                <td className="px-4 py-2"><input type="text" value={recipient.CertificateFile} onChange={(e) => handleCellChange(index, 'CertificateFile', e.target.value)} className="bg-transparent w-full outline-none" /></td>
                <td className={`px-4 py-2 font-mono font-semibold ${getStatusColor(recipient.Status)}`}>{recipient.Status || 'PENDING'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecipientTable;
