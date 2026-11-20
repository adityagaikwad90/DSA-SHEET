import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Search, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  XCircle, 
  Plus, 
  Download, 
  Sparkles, 
  Globe, 
  Building2, 
  Filter, 
  ChevronDown, 
  Calendar, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { fuzzyFilter } from '../utils/fuzzySearch';
import rawCareerData from '../data/careerCompaniesData.json';
import './Careers.css';

// Application status configurations
const APPLICATION_STATUSES = [
  { id: 'not_applied', label: 'Not Applied', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)' },
  { id: 'wishlist', label: 'Wishlist', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.4)', icon: Bookmark },
  { id: 'applied', label: 'Applied', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', icon: Clock },
  { id: 'interviewing', label: 'Interviewing', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', icon: Briefcase },
  { id: 'offer', label: 'Offer Received', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)', icon: Trophy },
  { id: 'rejected', label: 'Archived / Rejected', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.4)', icon: XCircle }
];

const CATEGORIES = [
  'All',
  'Big Tech & Tier 1',
  'AI & DeepTech',
  'FinTech & Quant',
  'Cloud & Enterprise SaaS',
  'High-Growth Startups & Unicorns',
  'E-Commerce & Digital Media',
  'Global Product Leaders'
];

const ALPHABET = ['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

export default function Careers() {
  const { currentUser } = useAuth();
  const storageUserId = currentUser?.uid || 'guest';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLetter, setSelectedLetter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyTracked, setOnlyTracked] = useState(false);

  // Application tracker state { [companyId]: { status, dateApplied, notes, roleTitle } }
  const [trackerData, setTrackerData] = useState(() => {
    try {
      const saved = localStorage.getItem(`dsa_career_tracker_${storageUserId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to parse tracker data', e);
      return {};
    }
  });

  // Custom user-added companies
  const [customCompanies, setCustomCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem(`dsa_custom_companies_${storageUserId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom companies', e);
      return [];
    }
  });

  // Modals state
  const [activeNoteCompany, setActiveNoteCompany] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    url: '',
    domain: '',
    category: 'Big Tech & Tier 1',
    initialStatus: 'wishlist',
    notes: '',
    roleTitle: ''
  });

  // Sync tracker changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`dsa_career_tracker_${storageUserId}`, JSON.stringify(trackerData));
    } catch (e) {
      console.error('Failed to save career tracker', e);
    }
  }, [trackerData, storageUserId]);

  // Sync custom companies to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`dsa_custom_companies_${storageUserId}`, JSON.stringify(customCompanies));
    } catch (e) {
      console.error('Failed to save custom companies', e);
    }
  }, [customCompanies, storageUserId]);

  // Merge directory companies with custom companies
  const allCompanies = useMemo(() => {
    const defaultList = rawCareerData?.companies || [];
    return [...customCompanies, ...defaultList];
  }, [customCompanies]);

  // Compute live application statistics
  const stats = useMemo(() => {
    let wishlist = 0;
    let applied = 0;
    let interviewing = 0;
    let offer = 0;
    let rejected = 0;

    Object.values(trackerData).forEach(item => {
      if (item?.status === 'wishlist') wishlist++;
      else if (item?.status === 'applied') applied++;
      else if (item?.status === 'interviewing') interviewing++;
      else if (item?.status === 'offer') offer++;
      else if (item?.status === 'rejected') rejected++;
    });

    const totalTracked = wishlist + applied + interviewing + offer + rejected;

    return {
      total: allCompanies.length,
      tracked: totalTracked,
      wishlist,
      applied,
      interviewing,
      offer,
      rejected
    };
  }, [trackerData, allCompanies]);

  // Update application status for a company
  const handleStatusChange = (company, newStatus) => {
    setTrackerData(prev => {
      const existing = prev[company.id] || {};
      const updated = {
        ...prev,
        [company.id]: {
          ...existing,
          companyName: company.name,
          url: company.url,
          category: company.category,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          dateApplied: newStatus === 'applied' && !existing.dateApplied 
            ? new Date().toISOString() 
            : existing.dateApplied
        }
      };

      const statusObj = APPLICATION_STATUSES.find(s => s.id === newStatus);
      if (newStatus !== 'not_applied') {
        toast.success(`Updated ${company.name} to "${statusObj?.label || newStatus}"`, {
          icon: '💼'
        });
      } else {
        toast.info(`Removed tracking status for ${company.name}`);
      }

      return updated;
    });
  };

  // Save notes for active company
  const handleSaveNotes = (companyId, notesText, roleText) => {
    setTrackerData(prev => {
      const existing = prev[companyId] || { status: 'wishlist' };
      return {
        ...prev,
        [companyId]: {
          ...existing,
          notes: notesText,
          roleTitle: roleText,
          updatedAt: new Date().toISOString()
        }
      };
    });
    toast.success('Application notes saved!');
    setActiveNoteCompany(null);
  };

  // Add custom company handler
  const handleAddCustomCompany = (e) => {
    e.preventDefault();
    if (!customForm.name.trim() || !customForm.url.trim()) {
      toast.error('Please enter both Company Name and Career Portal URL');
      return;
    }

    let cleanDomain = customForm.domain.trim();
    if (!cleanDomain) {
      try {
        const parsed = new URL(customForm.url.startsWith('http') ? customForm.url : `https://${customForm.url}`);
        cleanDomain = parsed.hostname.replace(/^www\./, '');
      } catch (err) {
        cleanDomain = customForm.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      }
    }

    const firstChar = customForm.name.trim()[0].toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '0-9';

    const newCompany = {
      id: `custom_${Date.now()}`,
      name: customForm.name.trim(),
      url: customForm.url.trim().startsWith('http') ? customForm.url.trim() : `https://${customForm.url.trim()}`,
      domain: cleanDomain,
      letter,
      category: customForm.category,
      featured: false,
      remoteFriendly: true,
      isCustom: true,
      hiringRoles: customForm.roleTitle ? [customForm.roleTitle] : ['Software Engineer']
    };

    setCustomCompanies(prev => [newCompany, ...prev]);

    // Set initial status in tracker
    if (customForm.initialStatus) {
      setTrackerData(prev => ({
        ...prev,
        [newCompany.id]: {
          companyName: newCompany.name,
          url: newCompany.url,
          category: newCompany.category,
          status: customForm.initialStatus,
          notes: customForm.notes,
          roleTitle: customForm.roleTitle,
          updatedAt: new Date().toISOString(),
          dateApplied: customForm.initialStatus === 'applied' ? new Date().toISOString() : null
        }
      }));
    }

    toast.success(`Added ${newCompany.name} to target directory!`);
    setIsAddModalOpen(false);
    setCustomForm({
      name: '',
      url: '',
      domain: '',
      category: 'Big Tech & Tier 1',
      initialStatus: 'wishlist',
      notes: '',
      roleTitle: ''
    });
  };

  // Delete custom company
  const handleDeleteCustomCompany = (companyId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this custom target company?')) {
      setCustomCompanies(prev => prev.filter(c => c.id !== companyId));
      setTrackerData(prev => {
        const copy = { ...prev };
        delete copy[companyId];
        return copy;
      });
      toast.info('Custom company removed.');
    }
  };

  // Export applications to CSV
  const handleExportCSV = () => {
    const trackedKeys = Object.keys(trackerData).filter(id => trackerData[id]?.status && trackerData[id]?.status !== 'not_applied');
    if (trackedKeys.length === 0) {
      toast.warning('No tracked applications yet. Mark a few companies as Wishlist, Applied, or Interviewing first!');
      return;
    }

    const headers = ['Company Name', 'Category', 'Status', 'Role Title', 'Date Applied', 'Career URL', 'Notes'];
    const escapeCsvCell = (value) => {
      let safeValue = String(value ?? '');
      // Prevent spreadsheet apps from treating user-controlled cells as formulas.
      if (/^[\u0000-\u0020]*[=+\-@]/.test(safeValue)) {
        safeValue = `'${safeValue}`;
      }
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = trackedKeys.map(id => {
      const record = trackerData[id];
      const comp = allCompanies.find(c => c.id === id) || {};
      const statusLabel = APPLICATION_STATUSES.find(s => s.id === record.status)?.label || record.status;
      const dateAppliedFormatted = record.dateApplied ? new Date(record.dateApplied).toLocaleDateString() : '';

      return [
        comp.name || record.companyName || '',
        comp.category || record.category || '',
        statusLabel,
        record.roleTitle || '',
        dateAppliedFormatted,
        comp.url || record.url || '',
        record.notes || ''
      ].map(escapeCsvCell).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dsa_career_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Applications exported to CSV successfully!');
  };

  // Filtered companies pipeline
  const filteredCompanies = useMemo(() => {
    let result = allCompanies;

    // 1. Fuzzy Search Query
    if (searchQuery.trim()) {
      result = fuzzyFilter(result, searchQuery.trim(), ['name', 'domain', 'category', 'hiringRoles']);
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // 3. Alphabet Letter Filter
    if (selectedLetter !== 'All') {
      if (selectedLetter === '#') {
        result = result.filter(c => c.letter === '0-9' || !/^[a-zA-Z]/.test(c.name));
      } else {
        result = result.filter(c => c.name.toUpperCase().startsWith(selectedLetter));
      }
    }

    // 4. Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(c => {
        const itemStatus = trackerData[c.id]?.status || 'not_applied';
        return itemStatus === statusFilter;
      });
    }

    // 5. Remote Only
    if (onlyRemote) {
      result = result.filter(c => c.remoteFriendly);
    }

    // 6. Featured Only
    if (onlyFeatured) {
      result = result.filter(c => c.featured);
    }

    // 7. Only Tracked
    if (onlyTracked) {
      result = result.filter(c => {
        const st = trackerData[c.id]?.status;
        return st && st !== 'not_applied';
      });
    }

    return result;
  }, [allCompanies, searchQuery, selectedCategory, selectedLetter, statusFilter, onlyRemote, onlyFeatured, onlyTracked, trackerData]);

  return (
    <div className="careers-page">
      {/* Ambient background glow */}
      <div className="careers-ambient-bg" aria-hidden="true" />

      {/* Hero Header */}
      <header className="careers-hero">
        <div className="careers-hero-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Curated Ecosystem of 480+ Product Engineering Hubs</span>
        </div>

        <h1 className="careers-hero-title">
          Apply to Top Tech Companies & <span className="text-gradient-emerald">Track Every Step</span>
        </h1>

        <p className="careers-hero-subtitle">
          Direct verified application portals for global tech leaders, FAANGM alternatives, unicorns, 
          and high-frequency quant funds. Organize your pipeline from wishlist to offer letter.
        </p>

        {/* Dynamic Metric Tracker Strip */}
        <div className="careers-stats-grid">
          <div className="stat-pill stat-total" onClick={() => { setStatusFilter('All'); setOnlyTracked(false); }}>
            <div className="stat-label">Total Companies</div>
            <div className="stat-value">{stats.total}</div>
            <span className="stat-sub">Verified Portals</span>
          </div>

          <div 
            className={`stat-pill stat-wishlist ${statusFilter === 'wishlist' ? 'active-filter' : ''}`}
            onClick={() => { setStatusFilter(statusFilter === 'wishlist' ? 'All' : 'wishlist'); }}
          >
            <div className="stat-label">
              <Bookmark size={14} /> Wishlist
            </div>
            <div className="stat-value text-indigo">{stats.wishlist}</div>
            <span className="stat-sub">Target Firms</span>
          </div>

          <div 
            className={`stat-pill stat-applied ${statusFilter === 'applied' ? 'active-filter' : ''}`}
            onClick={() => { setStatusFilter(statusFilter === 'applied' ? 'All' : 'applied'); }}
          >
            <div className="stat-label">
              <Clock size={14} /> Applied
            </div>
            <div className="stat-value text-sky">{stats.applied}</div>
            <span className="stat-sub">Submitted</span>
          </div>

          <div 
            className={`stat-pill stat-interview ${statusFilter === 'interviewing' ? 'active-filter' : ''}`}
            onClick={() => { setStatusFilter(statusFilter === 'interviewing' ? 'All' : 'interviewing'); }}
          >
            <div className="stat-label">
              <Briefcase size={14} /> Interviewing
            </div>
            <div className="stat-value text-amber">{stats.interviewing}</div>
            <span className="stat-sub">In Active Loops</span>
          </div>

          <div 
            className={`stat-pill stat-offer ${statusFilter === 'offer' ? 'active-filter' : ''}`}
            onClick={() => { setStatusFilter(statusFilter === 'offer' ? 'All' : 'offer'); }}
          >
            <div className="stat-label">
              <Trophy size={14} /> Offers
            </div>
            <div className="stat-value text-emerald">{stats.offer}</div>
            <span className="stat-sub">Unlocked 🎉</span>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="careers-action-bar">
          <button 
            type="button" 
            className="careers-cta-btn btn-emerald"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Add Custom Target Company
          </button>

          <button 
            type="button" 
            className="careers-cta-btn btn-secondary"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet size={16} /> Export Applications (CSV)
          </button>
        </div>
      </header>

      {/* Main Filter Section */}
      <section className="careers-controls-wrapper">
        {/* Search & Quick Toggles */}
        <div className="search-and-toggles-row">
          <div className="careers-search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search companies by name, domain (e.g. google.com), sector or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="careers-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="quick-toggles-group">
            <button 
              type="button"
              className={`toggle-chip ${onlyTracked ? 'active' : ''}`}
              onClick={() => setOnlyTracked(!onlyTracked)}
            >
              <Bookmark size={14} /> My Applications ({stats.tracked})
            </button>

            <button 
              type="button"
              className={`toggle-chip ${onlyFeatured ? 'active' : ''}`}
              onClick={() => setOnlyFeatured(!onlyFeatured)}
            >
              <Sparkles size={14} /> Featured Tier-1
            </button>

            <button 
              type="button"
              className={`toggle-chip ${onlyRemote ? 'active' : ''}`}
              onClick={() => setOnlyRemote(!onlyRemote)}
            >
              <Globe size={14} /> Remote-Friendly
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="categories-scroll-row">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`category-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs */}
        <div className="status-filter-tabs">
          <span className="status-filter-label">Filter Pipeline:</span>
          <button 
            type="button"
            className={`status-tab ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All Statuses
          </button>
          {APPLICATION_STATUSES.map(st => (
            <button
              key={st.id}
              type="button"
              className={`status-tab ${statusFilter === st.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(st.id)}
              style={statusFilter === st.id ? { borderColor: st.color, color: st.color } : {}}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Alphabet A-Z Quick Jump Bar */}
        <div className="alphabet-scrubber">
          <span className="alphabet-label">A-Z Index:</span>
          <div className="alphabet-keys">
            {ALPHABET.map(letter => (
              <button
                key={letter}
                type="button"
                className={`letter-btn ${selectedLetter === letter ? 'active' : ''}`}
                onClick={() => setSelectedLetter(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Grid Header */}
      <div className="directory-results-meta">
        <span className="results-count">
          Showing <strong>{filteredCompanies.length}</strong> matching companies
        </span>
        {(searchQuery || selectedCategory !== 'All' || selectedLetter !== 'All' || statusFilter !== 'All' || onlyRemote || onlyFeatured || onlyTracked) && (
          <button 
            type="button" 
            className="reset-all-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedLetter('All');
              setStatusFilter('All');
              setOnlyRemote(false);
              setOnlyFeatured(false);
              setOnlyTracked(false);
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="empty-careers-state">
          <Building2 size={48} className="empty-icon" />
          <h3>No companies found</h3>
          <p>Try adjusting your search query, sector pill, or status filters.</p>
          <button 
            type="button" 
            className="careers-cta-btn btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedLetter('All');
              setStatusFilter('All');
              setOnlyTracked(false);
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="companies-cards-grid">
          {filteredCompanies.map(company => {
            const currentRecord = trackerData[company.id] || {};
            const currentStatus = currentRecord.status || 'not_applied';
            const statusConfig = APPLICATION_STATUSES.find(s => s.id === currentStatus) || APPLICATION_STATUSES[0];
            const hasNotes = Boolean(currentRecord.notes || currentRecord.roleTitle);

            // Google favicon service
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`;

            return (
              <motion.div 
                key={company.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`company-card ${company.featured ? 'is-featured' : ''} ${currentStatus !== 'not_applied' ? 'is-tracked' : ''}`}
              >
                {/* Card Top Row */}
                <div className="company-card-top">
                  <div className="company-brand-box">
                    <img 
                      src={faviconUrl} 
                      alt="" 
                      className="company-favicon"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="company-avatar-fallback" style={{ display: 'none' }}>
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="company-title-wrap">
                    <div className="company-name-row">
                      <h3 className="company-name" title={company.name}>{company.name}</h3>
                      {company.featured && (
                        <span className="featured-chip" title="Tier-1 Engineering Benchmarks">
                          Featured
                        </span>
                      )}
                      {company.isCustom && (
                        <button 
                          type="button" 
                          className="delete-custom-btn"
                          title="Delete Custom Company"
                          onClick={(e) => handleDeleteCustomCompany(company.id, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <span className="company-domain">{company.domain}</span>
                  </div>
                </div>

                {/* Card Category & Attributes */}
                <div className="company-badges-row">
                  <span className="category-badge">
                    {company.category}
                  </span>
                  {company.remoteFriendly && (
                    <span className="remote-badge" title="Offers Remote / Hybrid Opportunities">
                      Remote / Hybrid
                    </span>
                  )}
                </div>

                {/* Hiring Roles Chips */}
                {company.hiringRoles && company.hiringRoles.length > 0 && (
                  <div className="hiring-roles-chips">
                    {company.hiringRoles.slice(0, 3).map((role, rIdx) => (
                      <span key={rIdx} className="role-chip">
                        {role}
                      </span>
                    ))}
                    {company.hiringRoles.length > 3 && (
                      <span className="role-chip-more">
                        +{company.hiringRoles.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Tracking Status Dropdown */}
                <div className="company-status-selector-row">
                  <span className="status-selector-label">My Status:</span>
                  <div className="status-dropdown-wrapper">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(company, e.target.value)}
                      className="status-dropdown-select"
                      style={{ 
                        color: statusConfig.color,
                        backgroundColor: statusConfig.bg,
                        borderColor: statusConfig.border
                      }}
                    >
                      {APPLICATION_STATUSES.map(opt => (
                        <option key={opt.id} value={opt.id} style={{ color: '#f8fafc', background: '#121722' }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* If notes or role title saved */}
                {hasNotes && (
                  <div className="saved-note-preview" onClick={() => setActiveNoteCompany(company)}>
                    {currentRecord.roleTitle && (
                      <div className="note-preview-role">Role: <strong>{currentRecord.roleTitle}</strong></div>
                    )}
                    {currentRecord.notes && (
                      <div className="note-preview-text">"{currentRecord.notes}"</div>
                    )}
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="company-card-footer">
                  <button 
                    type="button" 
                    className={`btn-note-toggle ${hasNotes ? 'has-notes' : ''}`}
                    title={hasNotes ? 'Edit Application Notes' : 'Add Note / Target Role'}
                    onClick={() => setActiveNoteCompany(company)}
                  >
                    <Edit3 size={14} />
                    <span>{hasNotes ? 'Notes' : 'Add Note'}</span>
                  </button>

                  <a 
                    href={company.url}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-apply-cta"
                    onClick={() => {
                      if (currentStatus === 'not_applied') {
                        handleStatusChange(company, 'applied');
                      }
                    }}
                  >
                    <span>Apply Now</span>
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Note / Application Details Modal */}
      <AnimatePresence>
        {activeNoteCompany && (
          <div className="careers-modal-backdrop" onClick={() => setActiveNoteCompany(null)}>
            <motion.div 
              className="careers-modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-box">
                  <Edit3 size={18} className="text-emerald" />
                  <h3>Application Notes — {activeNoteCompany.name}</h3>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setActiveNoteCompany(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Target Role / Position Title</label>
                  <input 
                    type="text" 
                    defaultValue={trackerData[activeNoteCompany.id]?.roleTitle || ''}
                    placeholder="e.g. SDE II - Distributed Systems / Full Stack Lead"
                    id="modal-role-input"
                    className="modal-input"
                  />
                </div>

                <div className="form-group">
                  <label>Application Notes & Interview Timeline</label>
                  <textarea 
                    rows={4}
                    defaultValue={trackerData[activeNoteCompany.id]?.notes || ''}
                    placeholder="e.g. Applied via referral from Senior Architect on LinkedIn. Round 1 coding round scheduled on Nov 15. Key focus: Graph BFS & Rate Limiter design."
                    id="modal-notes-textarea"
                    className="modal-textarea"
                  />
                </div>

                <div className="modal-info-row">
                  <span className="modal-info-label">Direct Portal:</span>
                  <a 
                    href={activeNoteCompany.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="modal-portal-link"
                  >
                    {activeNoteCompany.url} <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="careers-cta-btn btn-secondary"
                  onClick={() => setActiveNoteCompany(null)}
                >
                  Cancel
                </button>

                <button 
                  type="button" 
                  className="careers-cta-btn btn-emerald"
                  onClick={() => {
                    const roleVal = document.getElementById('modal-role-input')?.value || '';
                    const notesVal = document.getElementById('modal-notes-textarea')?.value || '';
                    handleSaveNotes(activeNoteCompany.id, notesVal, roleVal);
                  }}
                >
                  <Check size={16} /> Save Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Custom Company Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="careers-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
            <motion.div 
              className="careers-modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-box">
                  <Building2 size={18} className="text-emerald" />
                  <h3>Add Target Company</h3>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustomCompany}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input 
                      type="text" 
                      required
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      placeholder="e.g. Anthropic, Datadog, Snowflake"
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Careers Portal / Job Opening URL *</label>
                    <input 
                      type="url" 
                      required
                      value={customForm.url}
                      onChange={(e) => setCustomForm({ ...customForm, url: e.target.value })}
                      placeholder="https://company.com/careers"
                      className="modal-input"
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Sector / Category</label>
                      <select 
                        value={customForm.category}
                        onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                        className="modal-select"
                      >
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Initial Status</label>
                      <select 
                        value={customForm.initialStatus}
                        onChange={(e) => setCustomForm({ ...customForm, initialStatus: e.target.value })}
                        className="modal-select"
                      >
                        {APPLICATION_STATUSES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Target Role (Optional)</label>
                    <input 
                      type="text" 
                      value={customForm.roleTitle}
                      onChange={(e) => setCustomForm({ ...customForm, roleTitle: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="modal-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes / Referral Contact (Optional)</label>
                    <textarea 
                      rows={3}
                      value={customForm.notes}
                      onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                      placeholder="e.g. Reached out to recruiter on LinkedIn, awaiting response."
                      className="modal-textarea"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="careers-cta-btn btn-secondary"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>

                  <button 
                    type="submit" 
                    className="careers-cta-btn btn-emerald"
                  >
                    <Plus size={16} /> Add to Target Directory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

