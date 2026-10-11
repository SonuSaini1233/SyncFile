import React from 'react';
import { Modal } from './Modal';
import { ShieldCheck, FileCheck } from 'lucide-react';

export function PrivacyModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" maxWidth="max-w-lg">
      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Student Data Protection Commitment</span>
        </div>

        <p>
          At <strong>SyncFile</strong>, we respect student privacy as a paramount standard. We ensure that your uploaded lecture notes, assignments, research materials, and documents remain strictly confidential and accessible exclusively to your authenticated Google account.
        </p>

        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">1. Information We Collect</h4>
        <p>
          We only store basic authentication details provided through Google OAuth (your display name, university email address, and profile photo) to personalize your dashboard.
        </p>

        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">2. File Storage and Encryption</h4>
        <p>
          Files are encrypted at rest and in transit via Firebase Cloud Storage and Firestore security infrastructure. Storage buckets are partitioned by student user IDs (<code className="bg-slate-100 px-1 py-0.5 rounded">users/{'{userId}'}</code>). Other students or third parties cannot view or query your files.
        </p>

        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">3. Session Security</h4>
        <p>
          SyncFile does not preserve long-lived local authentication tokens on public workstations or campus computer labs. Closing your browser session or tab terminates access.
        </p>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function TermsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" maxWidth="max-w-lg">
      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
          <FileCheck className="w-5 h-5" />
          <span>SyncFile Service Terms</span>
        </div>

        <p>
          By accessing and using <strong>SyncFile</strong>, you agree to the following terms designed to maintain a fast, reliable storage service for students:
        </p>

        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">1. Storage Quotas</h4>
        <p>
          Each student account is allocated exactly <strong>20 MB</strong> of total storage. Uploading files that exceed this limit is rejected by client and backend security enforcement.
        </p>

        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">2. Acceptable Use</h4>
        <p>
          SyncFile is designed for academic files, course materials, assignments, research code, and educational media. Users may not upload malicious software, illicit content, or infringe upon copyrighted materials.
        </p>

        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">3. Multi-Device Availability</h4>
        <p>
          Files are synchronized across devices through Cloud Storage and Firestore. SyncFile provides access from any modern browser without requiring native app installations.
        </p>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

