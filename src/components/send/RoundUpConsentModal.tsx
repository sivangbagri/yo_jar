import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import { Badge } from '@/components/ui/badge'
  import { Separator } from '@/components/ui/separator'
  
  interface Props {
    open: boolean
    actualAmount: string
    roundedAmount: string
    savingsAmount: string
    recipient: string
    onConsent: () => void
    onDecline: () => void
    isSaving: boolean
  }
  
  export function RoundUpConsentModal({
    open, actualAmount, roundedAmount, savingsAmount,
    recipient, onConsent, onDecline, isSaving
  }: Props) {
    return (
      <Dialog open={open}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-lg">Round up & save? 🫙</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Turn your spare change into yield automatically.
            </DialogDescription>
          </DialogHeader>
  
          <div className="space-y-4 py-2">
            {/* Breakdown */}
            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You're sending</span>
                <span className="font-medium">{actualAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rounded up to</span>
                <span className="font-medium">{roundedAmount} ETH</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Saved to yoBTC vault</span>
                <Badge variant="secondary" className="font-semibold text-green-600">
                  +{savingsAmount} ETH
                </Badge>
              </div>
            </div>
  
            <p className="text-xs text-muted-foreground">
              Recipient still gets <strong>{actualAmount} ETH</strong>. The extra{' '}
              <strong>{savingsAmount} ETH</strong> earns yield in your yoBTC vault.
            </p>
  
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onDecline}
                disabled={isSaving}
              >
                No thanks
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={onConsent}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Yes, save it ✨'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }