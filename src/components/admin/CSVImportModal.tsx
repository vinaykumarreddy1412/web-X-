import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import type { Team, TeamMember } from '../../types';
import { generateSecureQRToken } from '../../utils/qrGenerator';
import { Modal } from '../common/Modal';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (teams: Team[]) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [parsedTeams, setParsedTeams] = useState<Team[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        const newTeams: Team[] = [];
        const errList: string[] = [];

        rows.forEach((row, index) => {
          const rowNum = index + 2;
          const teamNumber = (row['Team Number'] || row['teamNumber'] || row['Team No'] || row['TeamId'] || '').toString().trim().toUpperCase();
          const teamName = (row['Team Name'] || row['teamName'] || '').toString().trim();
          const leadName = (row['Team Lead Name'] || row['teamLeadName'] || row['Team Lead'] || '').toString().trim();
          const leadRegNo = (row['Team Lead Registration Number'] || row['teamLeadRegNo'] || row['Team Lead Reg No'] || '').toString().trim().toUpperCase();

          if (!teamNumber || !leadRegNo) {
            errList.push(`Row ${rowNum}: Missing Team Number or Lead Registration Number.`);
            return;
          }

          const members: TeamMember[] = [
            { name: leadName || 'Team Lead', regNo: leadRegNo, role: 'Team Lead' }
          ];

          for (let i = 1; i <= 3; i++) {
            const mName = (row[`Member ${i} Name`] || row[`member${i}Name`] || row[`Member ${i}`] || '').toString().trim();
            const mRegNo = (row[`Member ${i} Registration Number`] || row[`member${i}RegNo`] || row[`Member ${i} Reg No`] || '').toString().trim().toUpperCase();
            if (mRegNo) {
              members.push({
                name: mName || `Student ${i + 1}`,
                regNo: mRegNo,
                role: 'Member'
              });
            }
          }

          newTeams.push({
            teamNumber,
            teamName: teamName || `Team ${teamNumber}`,
            teamLeadRegNo: leadRegNo,
            teamLeadName: leadName || 'Team Lead',
            qrToken: generateSecureQRToken(teamNumber),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            members
          });
        });

        setErrors(errList);
        setParsedTeams(newTeams);
      } catch (err: any) {
        setErrors([`Failed to parse Excel file: ${err?.message || 'Invalid format'}`]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirm = () => {
    if (parsedTeams.length > 0) {
      onImport(parsedTeams);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="IMPORT TEAMS FROM EXCEL / CSV" maxWidth="lg">
      <div className="space-y-4">
        
        <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50 transition-colors">
          <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">Upload Excel (.xlsx, .xls) or CSV File with Team Roster</p>
          <p className="text-[11px] text-slate-500 mt-1 mb-3">
            Supported columns: Team Number, Team Name, Team Lead Name, Team Lead Registration Number, Member 1 Name, Member 1 Registration Number, Member 2 Name, Member 2 Registration Number, etc.
          </p>
          
          <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md inline-flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Select Excel / CSV File</span>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          {fileName && <p className="text-xs font-bold text-emerald-600 mt-2">Selected: {fileName}</p>}
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-h-32 overflow-y-auto space-y-1">
            <p className="font-extrabold flex items-center space-x-1">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Validation Errors ({errors.length}):</span>
            </p>
            {errors.map((err, idx) => (
              <p key={idx} className="font-medium">• {err}</p>
            ))}
          </div>
        )}

        {parsedTeams.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              Valid Teams Preview ({parsedTeams.length} teams parsed from Excel):
            </p>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {parsedTeams.slice(0, 10).map(t => (
                <div key={t.teamNumber} className="p-2.5 flex items-center justify-between bg-white">
                  <div>
                    <span className="font-extrabold text-slate-900">{t.teamNumber} — {t.teamName}</span>
                    <p className="text-[10px] text-slate-500">Lead: {t.teamLeadName} ({t.teamLeadRegNo})</p>
                  </div>
                  <span className="font-bold text-slate-600">{t.members.length} Members</span>
                </div>
              ))}
              {parsedTeams.length > 10 && (
                <p className="p-2 text-[11px] text-center text-slate-400 font-bold">
                  ...and {parsedTeams.length - 10} more teams
                </p>
              )}
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CONFIRM IMPORT {parsedTeams.length} TEAMS</span>
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
};
