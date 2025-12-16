import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Filter, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { residentsService } from '../services/residentsService';
import { visitsService } from '../services/visitsService';
import type { Resident } from '../types';
import Button from '../components/ui/Button';

type ReportType = 'high_risk' | 'visit_logs' | 'demographics' | null;

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [activeRes, setActiveRes] = useState<Resident[]>([]);
  const [activeVisits, setActiveVisits] = useState<any[]>([]); // visits with resident data

  // Filter State
  const [reportType, setReportType] = useState<ReportType>('high_risk');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7) + '-01'); // First day of current month
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today

  // Preview Data
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resData, visData] = await Promise.all([
        residentsService.getAll(),
        visitsService.getAll()
      ]);
      setActiveRes(resData);
      setActiveVisits(visData);

      // Initial Preview Generation
      // We can defer this or auto-run it. Let's auto-run for High Risk default.
      generatePreview(resData, visData, 'high_risk', '', '');
    } catch (e) {
      console.error("Failed to load report data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    generatePreview(activeRes, activeVisits, reportType, startDate, endDate);
  };

  const generatePreview = (res: Resident[], vis: any[], type: ReportType, start: string, end: string) => {
    let data: any[] = [];
    let headers: string[] = [];

    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    if (type === 'high_risk') {
      data = res.filter(r => {
        // Filter by High Risk AND Last Visit Date within range
        const isHighRisk = r.risk_level === 'High';
        if (!isHighRisk) return false;

        // If no date filter, return all high risk
        if (!start && !end) return true;

        if (!r.last_visit) return false; // Exclude if never visited when filtering by date
        const d = new Date(r.last_visit).getTime();
        return (!start || d >= s) && (!end || d <= e);
      }).map(r => ({
        Name: `${r.last_name}, ${r.first_name}`,
        Age: r.age,
        Gender: r.sex,
        RiskScore: r.risk_score,
        Conditions: r.conditions?.join(', ') || 'None',
        LastVisit: r.last_visit || 'N/A'
      }));
      headers = ['Name', 'Age', 'Gender', 'RiskScore', 'Conditions', 'LastVisit'];
    }
    else if (type === 'visit_logs') {
      data = vis.filter((v: any) => {
        const d = new Date(v.visit_date).getTime();
        return (!start || d >= s) && (!end || d <= e);
      }).map((v: any) => ({
        Date: v.visit_date,
        Resident: v.residents ? `${v.residents.last_name}, ${v.residents.first_name}` : 'Unknown',
        Notes: v.notes,
        FollowUp: v.follow_up_required ? 'Yes' : 'No'
      }));
      headers = ['Date', 'Resident', 'Notes', 'FollowUp'];
    }
    else if (type === 'demographics') {
      // Filter residents by registration date (created_at)
      const filteredRes = res.filter(r => {
        if (!start && !end) return true;

        // Handle missing created_at just in case (though schema has default now())
        const dateStr = r.created_at || '2024-01-01';
        const d = new Date(dateStr).getTime();
        return (!start || d >= s) && (!end || d <= e);
      });

      // Aggregate data based on filtered list
      const total = filteredRes.length;
      const seniors = filteredRes.filter(r => r.is_senior).length;
      const pwds = filteredRes.filter(r => r.is_pwd).length;
      const pregnant = filteredRes.filter(r => r.is_pregnant).length;
      const children = filteredRes.filter(r => r.is_child).length;

      data = [
        { Category: 'Total Residents', Count: total },
        { Category: 'Senior Citizens', Count: seniors },
        { Category: 'PWDs', Count: pwds },
        { Category: 'Pregnant Women', Count: pregnant },
        { Category: 'Children', Count: children }
      ];
      headers = ['Category', 'Count'];
    }

    setPreviewData(data);
    setPreviewHeaders(headers);
  };

  const generatePDF = () => {
    if (previewData.length === 0) return;

    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text("PULSE Health Report", 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 32);

      const typeLabel = reportType?.replace('_', ' ').toUpperCase();
      doc.text(`Type: ${typeLabel}`, 14, 38);

      // Always show period as it applies to all now
      doc.text(`Period: ${startDate} to ${endDate}`, 14, 44);

      // Table
      const tableColumn = previewHeaders;
      const tableRows = previewData.map(row => previewHeaders.map(h => row[h]));

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      });

      doc.save(`pulse_report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const downloadCSV = () => {
    if (previewData.length === 0) return;

    const csvContent = "data:text/csv;charset=utf-8,"
      + previewHeaders.join(",") + "\n"
      + previewData.map(row => previewHeaders.map(h => {
        const val = row[h] ? row[h].toString().replace(/,/g, ' ') : '';
        return `"${val}"`;
      }).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pulse_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
        <p className="text-gray-500 text-sm mt-1">Export resident data, visit logs, and demographic summaries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Configuration Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-gray-900">Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={reportType || ''}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                <option value="high_risk">High Risk Residents</option>
                <option value="visit_logs">Visit Logs</option>
                <option value="demographics">Demographics Summary</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 italic">
              {reportType === 'visit_logs' && 'Filters by Visit Date.'}
              {reportType === 'high_risk' && 'Filters by Last Visit Date.'}
              {reportType === 'demographics' && 'Filters by Registration Date.'}
            </p>

            <div className="pt-4">
              <Button className="w-full" onClick={handleGenerate}>
                Generate Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Report Preview</h3>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {previewData.length} records
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={generatePDF} disabled={previewData.length === 0}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCSV} disabled={previewData.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>

            <div id="report-content" className="flex-1 overflow-x-auto p-4 bg-white">
              {previewData.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewHeaders.map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {previewHeaders.map(h => (
                          <td key={`${i}-${h}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
                  <FileText className="w-12 h-12 mb-2 opacity-20" />
                  <p>No records found for the selected criteria.</p>
                </div>
              )}
            </div>
            {previewData.length > 10 && (
              <div className="p-2 bg-gray-50 text-center text-xs text-gray-500 border-t border-gray-200">
                Showing first 10 rows of {previewData.length} total records.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
