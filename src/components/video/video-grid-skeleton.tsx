import { Loader } from "@aws-amplify/ui-react";

type VideoGridSkeletonProps = Readonly<{
  count?: number;
  label?: string;
  incremental?: boolean;
}>;

export function VideoGridSkeleton({
  count = 6,
  label = "Cargando videos",
  incremental = false,
}: VideoGridSkeletonProps) {
  return (
    <div className={incremental ? "loading-block incremental" : "loading-block"} role="status" aria-label={label}>
      {incremental ? (
        <div className="loading-label">
          <Loader size="small" filledColor="var(--brand)" emptyColor="var(--app-line)" />
          <span>{label}</span>
        </div>
      ) : null}
      <div className="video-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="video-skeleton-card" key={index}>
            <div className="video-skeleton-thumbnail" />
            <div className="video-skeleton-row">
              <div className="video-skeleton-copy">
                <span className="video-skeleton-line title" />
                <span className="video-skeleton-line title short" />
                <span className="video-skeleton-line meta" />
                <span className="video-skeleton-line meta short" />
              </div>
              <span className="video-skeleton-action" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
