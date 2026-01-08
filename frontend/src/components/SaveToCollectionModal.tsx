import React, { useState, useEffect } from 'react';
import {
  Collection,
  getCollections,
  createCollection,
  updatePostCollections,
} from '../utils/savedPosts';
import logger from '../utils/logger';

interface SaveToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentCollectionIds: string[];
  onSave: (collectionIds: string[]) => void;
}

const SaveToCollectionModal: React.FC<SaveToCollectionModalProps> = ({
  isOpen,
  onClose,
  postId,
  currentCollectionIds,
  onSave,
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(currentCollectionIds);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
      setSelectedCollectionIds(currentCollectionIds);
      setShowNewCollectionInput(false);
      setNewCollectionName('');
      setError(null);
    }
  }, [isOpen, currentCollectionIds]);

  const loadCollections = () => {
    const loadedCollections = getCollections();
    setCollections(loadedCollections);
  };

  const handleToggleCollection = (collectionId: string) => {
    setSelectedCollectionIds((prev) => {
      if (prev.includes(collectionId)) {
        return prev.filter((id) => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  };

  const handleCreateNewCollection = () => {
    const trimmedName = newCollectionName.trim();

    if (!trimmedName) {
      setError('El nombre de la colección no puede estar vacío');
      return;
    }

    if (trimmedName.length > 50) {
      setError('El nombre no puede tener más de 50 caracteres');
      return;
    }

    const newCollection = createCollection(trimmedName);
    if (!newCollection) {
      setError('Ya existe una colección con ese nombre');
      return;
    }

    // Track create event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'create_collection_from_save', {
        collection_name: trimmedName,
        event_category: 'Collections',
      });
    }

    loadCollections();
    setSelectedCollectionIds((prev) => [...prev, newCollection.id]);
    setNewCollectionName('');
    setShowNewCollectionInput(false);
    setError(null);
  };

  const handleSave = () => {
    const success = updatePostCollections(postId, selectedCollectionIds);
    if (success) {
      // Track save event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'update_post_collections', {
          collections_count: selectedCollectionIds.length,
          event_category: 'Collections',
        });
      }
      onSave(selectedCollectionIds);
      onClose();
    } else {
      logger.error('Failed to update post collections');
      setError('Error al actualizar las colecciones');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Guardar en colecciones</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Collections List */}
          {collections.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Selecciona colecciones:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {collections.map((collection) => {
                  const isSelected = selectedCollectionIds.includes(collection.id);
                  return (
                    <label
                      key={collection.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-50 border-2 border-purple-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCollection(collection.id)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <span className={`ml-3 font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                        {collection.name}
                      </span>
                      {isSelected && (
                        <svg className="w-5 h-5 text-purple-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {collections.length === 0 && !showNewCollectionInput && (
            <div className="text-center py-6 mb-4">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500 mb-2">Aún no tienes colecciones</p>
              <p className="text-sm text-gray-400">Crea tu primera colección para organizar tus posts</p>
            </div>
          )}

          {/* New Collection Input */}
          {showNewCollectionInput ? (
            <div className="mb-4">
              <label htmlFor="newCollectionName" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva colección
              </label>
              <div className="flex gap-2">
                <input
                  id="newCollectionName"
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Ej: Fitness, Recetas, Viajes..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={50}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateNewCollection();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateNewCollection}
                  disabled={!newCollectionName.trim()}
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                >
                  Crear
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowNewCollectionInput(false);
                  setNewCollectionName('');
                  setError(null);
                }}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewCollectionInput(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva colección
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveToCollectionModal;
