import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Captions, X } from 'lucide-react'

function TranscriptTextModel({
    isOpen,
    setTranscriptOpen,
    selectedTrancriptText
}: {
    isOpen: boolean
    setTranscriptOpen: (value: boolean) => void
    selectedTrancriptText: string
}) {
    const handleClose = () => {
        setTranscriptOpen(false)
    }
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="!max-w-[500px] max-h-[90vh] p-0 overflow-y-auto bg-white border-gray-200 [&>button]:hidden">
                <DialogHeader className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Captions className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="!text-2xl font-bold">
                                Transcript
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 text-sm">
                                Selected recording transcript.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => handleClose()}
                            className="absolute top-4 right-4 text-white hover:bg-white/20 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-4 p-4 md:mr-6 overflow-y-auto h-[400px]">
                    {selectedTrancriptText ? (
                        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                            {selectedTrancriptText}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Captions className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg mb-2">No transcript available</p>
                            <p className="text-gray-400 text-sm">This meeting does not have a transcript yet.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="sticky bottom-0 z-10">
                    <div className=" bg-white w-full flex justify-end px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="px-6 text-sm font-medium cursor-pointer"
                            onClick={handleClose}
                        >
                            Exit
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default TranscriptTextModel
