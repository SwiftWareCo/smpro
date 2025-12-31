import { redirect } from 'next/navigation';
import { getClient } from '@/lib/data/data.clients';
import { getProjectsByClient, getDefaultProject, getProject, getProjectWithModules } from '@/lib/data/data.projects';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs';
import { EmptyProjectState } from '@/components/workspace/empty-project-state';

interface WorkspacePageProps {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ project?: string }>;
}

export default async function WorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { clientId } = await params;
  const { project: projectIdParam } = await searchParams;


  // Fetch client data
  const client = await getClient(clientId);

  if (!client) {
    redirect('/');
  }

  // Fetch all projects for this client
  const allProjects = await getProjectsByClient(clientId);

  // If no projects exist, show empty state instead of redirecting
  if (allProjects.length === 0) {
    return <EmptyProjectState client={client} clientId={clientId} />;
  }

  // Determine which project to use
  let selectedProject;
  if (projectIdParam) {
    selectedProject = await getProject(projectIdParam);
    // Verify project belongs to client
    if (selectedProject && selectedProject.clientId !== clientId) {
      selectedProject = null;
    }
  }

  // Fall back to default project if no valid project selected
  if (!selectedProject) {
    selectedProject = await getDefaultProject(clientId);
  }

  // If still no project found (shouldn't happen), show empty state
  if (!selectedProject) {
    return <EmptyProjectState client={client} clientId={clientId} />;
  }

  // Fetch project with modules
  const projectWithModules = await getProjectWithModules(selectedProject.id);
  if (!projectWithModules) {
    return <EmptyProjectState client={client} clientId={clientId} />;
  }

  return (
    <div className='flex flex-1 flex-col'>
      <WorkspaceHeader
        client={client}
        projects={allProjects}
        selectedProject={{ ...selectedProject, modules: projectWithModules.modules }}
      />
      <div className='flex flex-1 p-4'>
        <WorkspaceTabs project={projectWithModules} />
      </div>
    </div>
  );
}

