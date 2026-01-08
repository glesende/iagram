import React, { useState, useEffect } from 'react';
import {
  Collection,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionPostsCount,
} from '../utils/savedPosts';
import logger from '../utils/logger';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onCollectionsChange: () => void;
  editingCollection?: Collection | null;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  collections,
  onCollectionsChange,
  editingCollection,
}) => {
  const [collectionName, setCollectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCollection) {
      setCollectionName(editingCollection.name);
    } else {
      setCollectionName('');
    }
    setError(null);
  }, [editingCollection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedName = collectionName.trim();

    if (!trimmedName) {
      setError('El nombre de la colección no puede estar vacío');
      setIsSubmitting(false);
      return;
    }

    if (trimmedName.length > 50) {
      setError('El nombre no puede tener más de 50 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingCollection) {
        // Update existing collection
        const success = updateCollection(editingCollection.id, trimmedName);
        if (!success) {
          setError('Ya existe una colección con ese nombre');
          setIsSubmitting(false);
          return;
        }

        // Track edit event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'edit_collection', {
            collection_name: trimmedName,
            event_category: 'Collections',
          });
        }
      } else {
        // Create new collection
        const newCollection = createCollection(trimmedName);
        if (!newCollection) {
          setError('Ya existe una colección con ese nombre');
          setIsSubmitting(false);
          return;
        }

        // Track create event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'create_collection', {
            collection_name: trimmedName,
            event_category: 'Collections',
          });
        }
      }

      onCollectionsChange();
      setCollectionName('');
      onClose();
    } catch (err) {
      logger.error('Error saving collection:', err);
      setError('Ocurrió un error al guardar la colección');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (collectionId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta colección? Los posts guardados no se eliminarán.')) {
      const success = deleteCollection(collectionId);
      if (success) {
        // Track delete event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'delete_collection', {
            event_category: 'Collections',
          });
        }
        onCollectionsChange();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {editingCollection ? 'Editar Colección' : 'Gestionar Colecciones'}
          </h2>
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
          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700 mb-2">
              {editingCollection ? 'Nuevo nombre' : 'Nueva colección'}
            </label>
            <div className="flex gap-2">
              <input
                id="collectionName"
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Ej: Fitness, Recetas, Viajes..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={50}
                autoFocus
              />
              <button
                type="submit"
                disabled={isSubmitting || !collectionName.trim()}
                className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary-dark hover:to-brand-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
              >
                {editingCollection ? 'Guardar' : 'Crear'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </form>

          {/* Collections List */}
          {!editingCollection && collections.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tus colecciones</h3>
              <div className="space-y-2">
                {collections.map((collection) => {
                  const postsCount = getCollectionPostsCount(collection.id);
                  return (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{collection.name}</h4>
                        <p className="text-sm text-gray-500">
                          {postsCount} {postsCount === 1 ? 'post' : 'posts'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(collection.id)}
                        className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Eliminar colección"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!editingCollection && collections.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500">Aún no tienes colecciones</p>
              <p className="text-sm text-gray-400 mt-1">Crea tu primera colección arriba</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionModal;
