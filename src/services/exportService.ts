import ExcelJS from 'exceljs';
import type { Team, Session, AttendanceRecord } from '../types';

export const exportSessionAttendanceToExcel = async (
  session: Session,
  teams: Team[],
  attendanceRecords: AttendanceRecord[]
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Web X Attendance System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(`${session.sessionId} Attendance`, {
    views: [{ showGridLines: true }]
  });

  // Define Columns exactly as requested: Team No, Team Name, Student Name, Status
  worksheet.columns = [
    { header: 'Team No', key: 'teamNo', width: 16 },
    { header: 'Team Name', key: 'teamName', width: 28 },
    { header: 'Student Name', key: 'studentName', width: 28 },
    { header: 'Status', key: 'status', width: 18 }
  ];

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Dark Slate / Navy
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });

  const recordMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach(r => recordMap.set(`${r.sessionId}_${r.teamNumber}`, r));

  // Populate data rows for each team and its 4 members
  teams.forEach(team => {
    const record = recordMap.get(`${session.sessionId}_${team.teamNumber}`);
    const memberMap = new Map<string, string>();
    if (record) {
      record.members.forEach(m => memberMap.set(m.regNo, m.status));
    }

    team.members.forEach(member => {
      const isRecordPresent = !!record;
      const statusRaw = isRecordPresent ? (memberMap.get(member.regNo) || 'absent') : 'absent';
      const isPresent = statusRaw.toLowerCase() === 'present';
      const displayStatus = isPresent ? 'PRESENT' : 'ABSENT';

      const row = worksheet.addRow({
        teamNo: team.teamNumber,
        teamName: team.teamName,
        studentName: member.name,
        status: displayStatus
      });

      row.height = 22;

      // Style standard cells
      row.getCell('teamNo').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('teamNo').font = { bold: true };

      row.getCell('teamName').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('studentName').alignment = { vertical: 'middle', horizontal: 'left' };

      // Apply Green color for PRESENT, Red color for ABSENT
      const statusCell = row.getCell('status');
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      statusCell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: isPresent ? 'FF15803D' : 'FFDC2626' } // Deep Green / Deep Red
      };

      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isPresent ? 'FFDCFCE7' : 'FFFEE2E2' } // Light Green / Light Red Pill Fill
      };

      // Add clean borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });
  });

  // Write and trigger download in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `WebX_${session.sessionId}_${session.sessionName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Attendance.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export const exportTeamSummaryToExcel = async (
  teams: Team[],
  sessions: Session[],
  attendanceRecords: AttendanceRecord[]
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Web X Attendance System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Teams Summary', {
    views: [{ showGridLines: true }]
  });

  const columns: any[] = [
    { header: 'Team No', key: 'teamNo', width: 16 },
    { header: 'Team Name', key: 'teamName', width: 28 },
    { header: 'Student Name', key: 'studentName', width: 28 }
  ];

  sessions.forEach((s) => {
    columns.push({ header: s.sessionName, key: s.sessionId, width: 22 });
  });

  worksheet.columns = columns;

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const recordMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach(r => recordMap.set(`${r.sessionId}_${r.teamNumber}`, r));

  teams.forEach(team => {
    team.members.forEach(member => {
      const rowData: Record<string, any> = {
        teamNo: team.teamNumber,
        teamName: team.teamName,
        studentName: member.name
      };

      sessions.forEach(sess => {
        const record = recordMap.get(`${sess.sessionId}_${team.teamNumber}`);
        let isPresent = false;
        if (record) {
          const m = record.members.find(rm => rm.regNo === member.regNo);
          if (m && m.status === 'present') isPresent = true;
        }
        rowData[sess.sessionId] = isPresent ? 'PRESENT' : 'ABSENT';
      });

      const row = worksheet.addRow(rowData);
      row.height = 22;

      row.getCell('teamNo').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('teamNo').font = { bold: true };
      row.getCell('teamName').alignment = { vertical: 'middle', horizontal: 'left' };
      row.getCell('studentName').alignment = { vertical: 'middle', horizontal: 'left' };

      sessions.forEach(sess => {
        const cell = row.getCell(sess.sessionId);
        const isPresent = cell.value === 'PRESENT';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: isPresent ? 'FF15803D' : 'FFDC2626' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isPresent ? 'FFDCFCE7' : 'FFFEE2E2' }
        };
      });

      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `WebX_Teams_All_Sessions_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

// Backward-compatible aliases
export const exportSessionAttendanceToCSV = exportSessionAttendanceToExcel;
export const exportTeamSummaryToCSV = exportTeamSummaryToExcel;
