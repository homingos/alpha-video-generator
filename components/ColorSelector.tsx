'use client';

interface ColorSelectorProps {
    selectedColor: 'green' | 'blue';
    onColorChange: (color: 'green' | 'blue') => void;
    disabled?: boolean;
}

export default function ColorSelector({ selectedColor, onColorChange, disabled = false }: ColorSelectorProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Select Background Color to Remove</h3>

            <div className="flex gap-4">
                {/* Green Option */}
                <button
                    onClick={() => onColorChange('green')}
                    disabled={disabled}
                    className={`
            flex-1 p-4 rounded-xl border-2 transition-all duration-300
            flex flex-col items-center gap-3
            ${selectedColor === 'green'
                            ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/20'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg"></div>
                        {selectedColor === 'green' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <span className={`font-medium ${selectedColor === 'green' ? 'text-green-300' : 'text-gray-400'}`}>
                        Green Screen
                    </span>
                </button>

                {/* Blue Option */}
                <button
                    onClick={() => onColorChange('blue')}
                    disabled={disabled}
                    className={`
            flex-1 p-4 rounded-xl border-2 transition-all duration-300
            flex flex-col items-center gap-3
            ${selectedColor === 'blue'
                            ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg"></div>
                        {selectedColor === 'blue' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <span className={`font-medium ${selectedColor === 'blue' ? 'text-blue-300' : 'text-gray-400'}`}>
                        Blue Screen
                    </span>
                </button>
            </div>
        </div>
    );
}
