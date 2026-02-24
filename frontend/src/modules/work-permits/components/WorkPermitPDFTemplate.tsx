import { format } from 'date-fns';
import type {
  WorkPermit,
  ApprovalTimelineItem,
} from '../types/work-permit.types';

const na = (v: unknown) => (v != null && v !== '' ? String(v) : '—');

interface WorkPermitPDFTemplateProps {
  workPermit: WorkPermit;
  timeline: ApprovalTimelineItem[];
}

export function WorkPermitPDFTemplate({ workPermit, timeline }: WorkPermitPDFTemplateProps) {
  const rows: [string, string][] = [
    ['ID', na(workPermit.id)],
    ['Code', na(workPermit.code)],
    ['Project Name', na(workPermit.projectName)],
    ['Status', na(workPermit.status)],
    ['Is Active', workPermit.isActive != null ? String(workPermit.isActive) : '—'],
    ['Area', workPermit.area ? `${workPermit.area.name ?? ''} (${workPermit.area.code ?? ''})`.trim() || '—' : na(workPermit.areaId)],
    ['Company', workPermit.company ? `${workPermit.company.name ?? ''} (${workPermit.company.code ?? ''})`.trim() || '—' : na(workPermit.companyId)],
    ['Proposed Start Date', workPermit.proposedStartDate ? format(new Date(workPermit.proposedStartDate), 'dd MMM yyyy') : '—'],
    ['Proposed End Date', workPermit.proposedEndDate ? format(new Date(workPermit.proposedEndDate), 'dd MMM yyyy') : '—'],
    ['Work Stages Description', na(workPermit.workStagesDescription)],
    ['Job Safety Analysis', na(workPermit.jobSafetyAnalysis)],
    ['Work Requirements', na(workPermit.workRequirements)],
    ['Safety Guideline', na(workPermit.safetyGuideline)],
    ['Require Course Verification', workPermit.requireCourseVerification != null ? String(workPermit.requireCourseVerification) : '—'],
    ['Created By', workPermit.creator ? `${workPermit.creator.firstName ?? ''} ${workPermit.creator.lastName ?? ''}`.trim() || workPermit.creator.email || '—' : na(workPermit.createdBy)],
    ['Created At', workPermit.createdAt ? format(new Date(workPermit.createdAt), 'dd MMM yyyy HH:mm') : '—'],
    ['Updated At', workPermit.updatedAt ? format(new Date(workPermit.updatedAt), 'dd MMM yyyy HH:mm') : '—'],
  ];

  const classifications = workPermit.classifications ?? [];
  const employees = workPermit.employees ?? [];
  const workers = workPermit.workers ?? [];
  const heavyEquipment = workPermit.heavyEquipment ?? [];
  const tools = workPermit.tools ?? [];
  const materials = workPermit.materials ?? [];
  const machines = workPermit.machines ?? [];
  const professions = workPermit.professions ?? [];
  const requiredCourses = workPermit.requiredCourses ?? [];
  const hazards = workPermit.hazards ?? [];
  const attachments = workPermit.attachments ?? [];
  const supervisors = workPermit.supervisors ?? [];
  const hseOfficers = workPermit.hseOfficers ?? [];
  const safetyEquipment = workPermit.safetyEquipment ?? [];

  return (
    <div className="bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Work Permit: {na(workPermit.code)}
        </h1>
        <p className="text-sm text-gray-600 mb-1">{na(workPermit.projectName)}</p>
        <p className="text-sm text-gray-600">Generated on {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
      </div>

      {/* Main attributes */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          Work Permit Details
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700 w-1/3">Attribute</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([attr, value], i) => (
                <tr key={i}>
                  <td className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700">{attr}</td>
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900 whitespace-pre-wrap">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classifications */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Classifications</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Work Classification (Name / Code)</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {classifications.length === 0 ? (
                <tr><td colSpan={3} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                classifications.map((c, i) => (
                  <tr key={c.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {c.workClassification ? `${na(c.workClassification.name)} / ${na(c.workClassification.code)}` : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(c.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employees */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Employees</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">User (Name / Email)</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Employee Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={4} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                employees.map((e, i) => (
                  <tr key={e.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {e.user ? `${na(e.user.firstName)} ${na(e.user.lastName)} / ${na(e.user.email)}` : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(e.employeeName)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(e.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workers */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Workers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">User (Name / Email)</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">ID Number</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Certificate URL</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Health Declaration URL</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr><td colSpan={6} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                workers.map((w, i) => (
                  <tr key={w.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {w.user ? `${na(w.user.firstName)} ${na(w.user.lastName)} / ${na(w.user.email)}` : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(w.idNumber)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(w.certificateUrl)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(w.healthDeclarationUrl)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(w.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heavy Equipment */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Heavy Equipment</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {heavyEquipment.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                heavyEquipment.map((e, i) => (
                  <tr key={e.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(e.heavyEquipment?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(e.heavyEquipment?.code)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(e.quantity)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(e.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tools */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Tools</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {tools.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                tools.map((t, i) => (
                  <tr key={t.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(t.tool?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(t.tool?.code)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(t.quantity)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(t.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Materials</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                materials.map((m, i) => (
                  <tr key={m.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.material?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.material?.code)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.quantity)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machines */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Machines</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {machines.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                machines.map((m, i) => (
                  <tr key={m.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.machine?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.machine?.code)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.quantity)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(m.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Professions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Quantity</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {professions.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                professions.map((p, i) => (
                  <tr key={p.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(p.profession?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(p.profession?.code)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(p.quantity)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(p.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Required Courses */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Required Courses</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Title</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Slug</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Is Required</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {requiredCourses.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                requiredCourses.map((c, i) => (
                  <tr key={c.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(c.course?.title)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(c.course?.slug)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{c.isRequired != null ? String(c.isRequired) : '—'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(c.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hazards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Hazards</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Hazard Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Description</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Control Measure</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {hazards.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                hazards.map((h, i) => (
                  <tr key={h.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(h.hazardName)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(h.description)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(h.controlMeasure)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(h.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attachments */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Attachments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">File Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">File URL</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">File Type</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Description</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Order</th>
              </tr>
            </thead>
            <tbody>
              {attachments.length === 0 ? (
                <tr><td colSpan={6} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                attachments.map((a, i) => (
                  <tr key={a.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(a.fileName)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(a.fileUrl)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(a.fileType)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(a.description)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(a.order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisors */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Supervisors</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Guest Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Phone</th>
              </tr>
            </thead>
            <tbody>
              {supervisors.length === 0 ? (
                <tr><td colSpan={4} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                supervisors.map((s, i) => (
                  <tr key={s.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(s.guest?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(s.guest?.email)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(s.guest?.phone)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HSE Officers */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">HSE Officers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">User (Name / Email)</th>
              </tr>
            </thead>
            <tbody>
              {hseOfficers.length === 0 ? (
                <tr><td colSpan={2} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                hseOfficers.map((h, i) => (
                  <tr key={h.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {h.user ? `${na(h.user.firstName)} ${na(h.user.lastName)} / ${na(h.user.email)}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Equipment */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Safety Equipment</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Code</th>
              </tr>
            </thead>
            <tbody>
              {safetyEquipment.length === 0 ? (
                <tr><td colSpan={3} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                safetyEquipment.map((s, i) => (
                  <tr key={s.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(s.safetyEquipment?.name)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(s.safetyEquipment?.code)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Timeline */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">Approval Timeline</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">No</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">By</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {timeline.length === 0 ? (
                <tr><td colSpan={5} className="border border-gray-300 px-3 py-2 text-xs text-gray-500">—</td></tr>
              ) : (
                timeline.map((item, i) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(item.status)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">
                      {item.createdBy ? `${na(item.createdBy.firstName)} ${na(item.createdBy.lastName)}` : '—'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-xs text-gray-900">{na(item.notes)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
