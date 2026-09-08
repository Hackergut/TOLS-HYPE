import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export function AgeDisclaimerCard({
  onAccept,
  onDecline,
}: {
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>18+ only</CardTitle>
        <CardDescription>
          You must be 18 or the legal age in your region. Gambling is entertainment — never stake more than you can lose.{" "}
          <Link to="/responsible" className="text-lime underline-offset-2 hover:underline">
            Game responsibly
          </Link>
          {" · "}
          <Link to="/terms" className="text-lime underline-offset-2 hover:underline">
            Terms
          </Link>
        </CardDescription>
      </CardHeader>
      {onAccept || onDecline ? (
        <CardFooter className="justify-end gap-2">
          {onDecline ? (
            <Button variant="outline" onClick={onDecline}>
              Decline
            </Button>
          ) : null}
          {onAccept ? <Button onClick={onAccept}>I am 18+</Button> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
