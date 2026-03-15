import React from 'react';
import { Plus, Presentation as PresentationIcon, Trash2, Clock, Play, Search, FolderOpen, Zap, Settings as SettingsIcon, Folder, X, FolderPlus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Presentation, Folder as FolderType } from '../types';
import { storage } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
	onSelect: (id: string) => void;
	onCreate: (folderId?: string) => void;
	onPlay: (id: string) => void;
	onSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelect, onCreate, onPlay, onSettings }) => {
	const [presentations, setPresentations] = React.useState<Presentation[]>(() => storage.getPresentations());
	const [folders, setFolders] = React.useState<FolderType[]>(() => storage.getFolders());
	const [selectedFolderId, setSelectedFolderId] = React.useState<string>('all');
	const [searchQuery, setSearchQuery] = React.useState('');
	const [deletingId, setDeletingId] = React.useState<string | null>(null);
	const [isFolderModalOpen, setIsFolderModalOpen] = React.useState(false);
	const [editingFolder, setEditingFolder] = React.useState<FolderType | null>(null);
	const [newFolderName, setNewFolderName] = React.useState('');
	const [movingPresentationId, setMovingPresentationId] = React.useState<string | null>(null);

	React.useEffect(() => {
		const load = () => {
			setPresentations(storage.getPresentations());
			setFolders(storage.getFolders());
		};
		load();
		window.addEventListener('storage', load);
		return () => window.removeEventListener('storage', load);
	}, []);

	const filteredPresentations = presentations.filter(p => {
		const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFolder = selectedFolderId === 'all' ||
			(selectedFolderId === 'uncategorized' && !p.folderId) ||
			p.folderId === selectedFolderId;
		return matchesSearch && matchesFolder;
	}).sort((p, q) =>
		q.updatedAt - p.updatedAt
	);

	const handleCreateFolder = () => {
		setEditingFolder(null);
		setNewFolderName('');
		setIsFolderModalOpen(true);
	};

	const handleEditFolder = (e: React.MouseEvent, folder: FolderType) => {
		e.stopPropagation();
		setEditingFolder(folder);
		setNewFolderName(folder.name);
		setIsFolderModalOpen(true);
	};

	const handleSaveFolder = () => {
		if (!newFolderName.trim()) return;

		const folder: FolderType = editingFolder
			? { ...editingFolder, name: newFolderName }
			: { id: uuidv4(), name: newFolderName, createdAt: Date.now() };

		storage.saveFolder(folder);
		setIsFolderModalOpen(false);
		setEditingFolder(null);
		setNewFolderName('');
		setFolders(storage.getFolders());
	};

	const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		if (confirm('Are you sure you want to delete this folder? Presentations will be moved to Uncategorized.')) {
			storage.deleteFolder(id);
			setFolders(storage.getFolders());
			setPresentations(storage.getPresentations());
			if (selectedFolderId === id) setSelectedFolderId('all');
		}
	};

	const handleMoveToFolder = (presentationId: string, folderId: string | undefined) => {
		storage.updatePresentationFolder(presentationId, folderId);
		setPresentations(storage.getPresentations());
		setMovingPresentationId(null);
	};

	const handleDeleteClick = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		setDeletingId(id);
	};

	const confirmDelete = () => {
		if (deletingId) {
			storage.deletePresentation(deletingId);
			setPresentations(storage.getPresentations());
			setDeletingId(null);
		}
	};

	return (
		<div className="min-h-screen bg-bg-dark text-white selection:bg-violet-500/30">
			<div className="relative z-10 max-w-[calc(100%-40px)] mx-auto px-6 py-12 lg:py-20">
				<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
					>
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 rounded-xl bg-grad-main flex items-center justify-center shadow-lg shadow-violet-500/20">
								<Zap size={24} className="text-white fill-white" />
							</div>
							<h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gradient">
								Presentify
							</h1>
						</div>
						<p className="text-text-muted text-lg">
							Create cinematic presentations from your notes in seconds.
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-4 w-full md:w-auto"
					>
						<div className="relative flex-1 md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
							<input
								type="text"
								placeholder="Search presentations..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all placeholder:text-text-dim"
							/>
						</div>
						<button
							onClick={() => {window.open('https://github.com/AlstonTang/presentify', '_blank')}}
							className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-text-dim group"
							title="GitHub"
						>
							<img src="src/assets/GitHub_Invertocat_White.svg" style={{width: '20px', height: '20px'}} className="opacity-50 transition-opacity duration 300 group-hover:opacity-100"></img>
						</button>
						<button
							onClick={onSettings}
							className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-text-dim hover:text-white transition-all"
							title="Settings"
						>
							<SettingsIcon size={20} />
						</button>
						<button onClick={() => onCreate(selectedFolderId !== 'all' && selectedFolderId !== 'uncategorized' ? selectedFolderId : undefined)} className="btn-primary whitespace-nowrap">
							<Plus size={20} />
							<span>New Slide Deck</span>
						</button>
					</motion.div>
				</header>

				<div className="flex flex-col lg:flex-row gap-12">
					{/* Sidebar */}
					<aside className="w-full lg:w-72 flex-shrink-0">
						<div className="sticky top-12 space-y-8">
							<div>
								<div className="flex items-center justify-between mb-6">
									<h2 className="text-xs font-bold uppercase tracking-widest text-text-dim">Your Library</h2>
									<button
										onClick={handleCreateFolder}
										className="p-2 hover:bg-white/5 rounded-lg text-text-dim hover:text-violet-400 transition-all"
										title="Create Folder"
									>
										<FolderPlus size={18} />
									</button>
								</div>

								<div className="space-y-1.5">
									{[
										{ id: 'all', name: 'All Presentations', icon: <PresentationIcon size={18} /> },
										{ id: 'uncategorized', name: 'Uncategorized', icon: <FolderOpen size={18} /> },
									].map(item => (
										<button
											key={item.id}
											onClick={() => setSelectedFolderId(item.id)}
											className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${selectedFolderId === item.id
												? 'bg-violet-500/20 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/10'
												: 'text-text-muted hover:bg-white/5 border border-transparent hover:border-white/5'
												}`}
										>
											{item.icon}
											<span className="font-medium">{item.name}</span>
										</button>
									))}
								</div>
							</div>

							<div>
								<h2 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-6">Folders</h2>
								<div className="space-y-1.5">
									{folders.length === 0 ? (
										<div className="px-4 py-8 text-center border border-dashed border-white/10 rounded-2xl">
											<Folder size={24} className="mx-auto text-text-dim/30 mb-2" />
											<p className="text-sm text-text-dim">No folders yet</p>
										</div>
									) : (
										folders.map(folder => (
											<div key={folder.id} className="group relative">
												<button
													onClick={() => setSelectedFolderId(folder.id)}
													className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${selectedFolderId === folder.id
														? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
														: 'text-text-muted hover:bg-white/5 border border-transparent hover:border-white/5'
														}`}
												>
													<Folder size={18} />
													<span className="font-medium truncate pr-8">{folder.name}</span>
												</button>
												<div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
													<button
														onClick={(e) => handleEditFolder(e, folder)}
														className="p-1.5 hover:bg-white/10 rounded-lg text-text-dim hover:text-white"
													>
														<Edit2 size={14} />
													</button>
													<button
														onClick={(e) => handleDeleteFolder(e, folder.id)}
														className="p-1.5 hover:bg-red-500/20 rounded-lg text-text-dim hover:text-red-400"
													>
														<Trash2 size={14} />
													</button>
												</div>
											</div>
										))
									)}
								</div>
							</div>
						</div>
					</aside>

					{/* Main Content */}
					<div className="flex-1">
						{presentations.length === 0 ? (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex flex-col items-center justify-center py-32 text-center"
							>
								<div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 animate-float">
									<FolderOpen size={48} className="text-text-dim" />
								</div>
								<h2 className="text-2xl font-bold mb-2">Your library is empty</h2>
								<p className="text-text-muted max-w-xs mb-8">
									Start by creating your first presentation or importing a markdown file.
								</p>
								<button onClick={() => onCreate(selectedFolderId !== 'all' && selectedFolderId !== 'uncategorized' ? selectedFolderId : undefined)} className="btn-secondary">
									<Plus size={20} />
									<span>Create First Presentation</span>
								</button>
							</motion.div>
						) : filteredPresentations.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
								<Search size={48} className="text-text-dim mb-4" />
								<h2 className="text-xl font-bold mb-1">No presentations found</h2>
								<p className="text-text-muted">Try adjusting your search or selected folder.</p>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
								<AnimatePresence initial={false}>
									{filteredPresentations.map((p, index) => (
										<motion.div
											key={p.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											style={{ zIndex: movingPresentationId === p.id ? 50 : 1 }}
											transition={{ delay: index * 0.05 }}
											whileHover={{ y: -8 }}
											className="glass-card group flex flex-col min-h-55 p-1 relative"
										>
											<div
												onClick={() => onSelect(p.id)}
												className="flex-1 p-6 cursor-pointer"
											>
												<div className="flex justify-between items-start mb-6">
													<div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:border-violet-500/50 transition-all duration-500">
														<PresentationIcon size={24} className="text-violet-400" />
													</div>
													<div className="flex gap-2">
														<div className="relative">
															<button
																onClick={(e) => { e.stopPropagation(); setMovingPresentationId(movingPresentationId === p.id ? null : p.id); }}
																className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${movingPresentationId === p.id ? 'bg-violet-500 text-white border-violet-500' : 'bg-white/5 text-text-dim hover:text-white border-transparent hover:border-white/10'}`}
																title="Move to Folder"
															>
																<Folder size={18} />
															</button>

															<AnimatePresence>
																{movingPresentationId === p.id && (
																	<motion.div
																		initial={{ opacity: 0, scale: 0.9, y: 10 }}
																		animate={{ opacity: 1, scale: 1, y: 0 }}
																		exit={{ opacity: 0, scale: 0.9, y: 10 }}
																		className="absolute right-0 top-12 z-50 w-56 bg-[#0a0e1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2"
																		onClick={(e) => e.stopPropagation()}
																	>
																		<div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-dim border-b border-white/5 mb-1">Move to Folder</div>
																		<button
																			onClick={() => handleMoveToFolder(p.id, undefined)}
																			className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl text-sm transition-colors text-left"
																		>
																			<FolderOpen size={14} className="text-text-dim" />
																			<span>Uncategorized</span>
																		</button>
																		{folders.map(f => (
																			<button
																				key={f.id}
																				onClick={() => handleMoveToFolder(p.id, f.id)}
																				className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl text-sm transition-colors text-left ${p.folderId === f.id ? 'text-violet-400 bg-violet-500/10' : ''}`}
																			>
																				<Folder size={14} className={p.folderId === f.id ? 'text-violet-400' : 'text-text-dim'} />
																				<span className="truncate">{f.name}</span>
																			</button>
																		))}
																	</motion.div>
																)}
															</AnimatePresence>
														</div>
														<button
															onClick={(e) => { e.stopPropagation(); onPlay(p.id); }}
															className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-green-500/20 rounded-xl text-green-400 border border-transparent hover:border-green-500/50 transition-all"
															title="Play Preview"
														>
															<Play size={18} fill="currentColor" />
														</button>
														<button
															onClick={(e) => handleDeleteClick(e, p.id)}
															className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 rounded-xl text-red-400 border border-transparent hover:border-red-500/50 transition-all"
															title="Delete"
														>
															<Trash2 size={18} />
														</button>
													</div>
												</div>

												<h3 className="text-xl font-bold mb-2 group-hover:text-violet-400 transition-colors line-clamp-2">
													{p.title}
												</h3>

												<div className="flex flex-wrap items-center text-sm text-text-dim gap-y-2 gap-x-4 mt-auto">
													<div className="flex items-center gap-1.5">
														<Clock size={14} />
														<span>{new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
													</div>
													{p.folderId && (
														<div className="flex items-center gap-1.5 text-violet-400">
															<Folder size={14} />
															<span className="truncate max-w-[100px]">{folders.find(f => f.id === p.folderId)?.name}</span>
														</div>
													)}
													<div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider font-bold ml-auto">
														{p.theme}
													</div>
												</div>
											</div>

											{/* Bottom Progress Bar Decoration */}
											<div className="h-1 rounded-b-2xl bg-transparent overflow-hidden">
												<div
													className="h-full bg-grad-main opacity-0 group-hover:opacity-100 transition-opacity duration-500"
													style={{ width: '100%' }}
												/>
											</div>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Folder Modal */}
			<AnimatePresence>
				{isFolderModalOpen && (
					<div className="fixed inset-0 z-100 flex items-center justify-center p-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsFolderModalOpen(false)}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="relative w-full max-w-md bg-[#0a0e1a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
						>
							<div className="absolute top-0 left-0 w-full h-1 bg-violet-500/50" />
							<div className="flex flex-col">
								<div className="flex justify-between items-center mb-6">
									<h3 className="text-2xl font-bold">{editingFolder ? 'Rename Folder' : 'New Folder'}</h3>
									<button onClick={() => setIsFolderModalOpen(false)} className="text-text-dim hover:text-white transition-colors">
										<X size={24} />
									</button>
								</div>

								<div className="space-y-4 mb-8">
									<div>
										<label className="text-xs font-bold uppercase tracking-widest text-text-dim mb-2 block">Folder Name</label>
										<input
											type="text"
											autoFocus
											placeholder="Enter folder name..."
											value={newFolderName}
											onChange={(e) => setNewFolderName(e.target.value)}
											onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()}
											className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
										/>
									</div>
								</div>

								<div className="flex gap-4">
									<button
										onClick={() => setIsFolderModalOpen(false)}
										className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all border border-white/10"
									>
										Cancel
									</button>
									<button
										onClick={handleSaveFolder}
										className="flex-1 px-6 py-3.5 bg-grad-main hover:brightness-110 rounded-2xl font-bold text-white transition-all shadow-[0_10px_20px_rgba(139,92,246,0.3)]"
									>
										{editingFolder ? 'Save Changes' : 'Create Folder'}
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Custom Delete Confirmation Modal */}
			<AnimatePresence>
				{deletingId && (
					<div className="fixed inset-0 z-100 flex items-center justify-center p-6 sm:p-0">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setDeletingId(null)}
							className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						/>
						<motion.div
							initial={{ opacity: 0, scale: 0.9, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9, y: 20 }}
							className="relative w-full max-w-md bg-[#0a0e1a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
						>
							<div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
							<div className="flex flex-col items-center text-center">
								<div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
									<Trash2 size={32} className="text-red-400" />
								</div>
								<h3 className="text-2xl font-bold mb-2">Delete Presentation?</h3>
								<p className="text-text-muted mb-8 text-[0.95rem] leading-relaxed">
									This action cannot be undone. All slides and content in this deck will be permanently removed.
								</p>
								<div className="flex gap-4 w-full">
									<button
										onClick={() => setDeletingId(null)}
										className="flex-1 px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all border border-white/10"
									>
										Cancel
									</button>
									<button
										onClick={confirmDelete}
										className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 rounded-2xl font-bold text-white transition-all shadow-[0_10px_20px_rgba(239,68,68,0.3)]"
									>
										Delete
									</button>
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
};
