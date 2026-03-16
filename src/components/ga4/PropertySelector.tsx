import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, Globe } from 'lucide-react';

interface Property {
  property_id: string;
  property_name: string;
}

interface Props {
  clientSlug: string;
  selectedProperty: string | null;
  onPropertyChange: (propertyId: string | null) => void;
}

const PropertySelector = ({ clientSlug, selectedProperty, onPropertyChange }: Props) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!clientSlug) return;

    const controller = new AbortController();

    fetch(`/api/ga4-properties?client=${clientSlug}`, {
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load properties');
        return res.json();
      })
      .then(data => {
        setProperties(data.properties || []);
        setError(null);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch properties:', err);
          setError(err.message);
          setProperties([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [clientSlug]);

  const selectedPropertyName = selectedProperty
    ? properties.find(p => p.property_id === selectedProperty)?.property_name || 'Unknown Property'
    : 'All Properties';

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground">
        <Globe className="w-3 h-3 animate-pulse" />
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs">
        <AlertTriangle className="w-3 h-3" />
        Error loading properties
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground">
        <Globe className="w-3 h-3" />
        No properties
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-semibold transition-colors"
      >
        <Globe className="w-3 h-3 text-muted-foreground" />
        <span>{selectedPropertyName}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 py-1 max-h-80 overflow-y-auto">
            <button
              onClick={() => {
                onPropertyChange(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                !selectedProperty ? 'bg-muted font-semibold' : ''
              }`}
            >
              All Properties
            </button>
            <div className="border-t border-border my-1" />
            {properties.map(property => (
              <button
                key={property.property_id}
                onClick={() => {
                  onPropertyChange(property.property_id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                  selectedProperty === property.property_id ? 'bg-muted font-semibold' : ''
                }`}
              >
                {property.property_name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertySelector;
