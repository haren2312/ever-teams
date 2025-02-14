import React from 'react';
import { useOrganizationProjects, useOrganizationTeams, useTeamTasks } from '@app/hooks';
import { Button } from '@components/ui/button';
import { MultiSelect } from 'lib/components/custom-select';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { SettingFilterIcon } from '@/assets/svg';
import { useTranslations } from 'next-intl';
import { useTimelogFilterOptions } from '@/app/hooks';
import { useTimesheet } from '@/app/hooks/features/useTimesheet';
import { cn } from '@/lib/utils';
import { statusTable } from './TimesheetAction';

export const TimeSheetFilterPopover = React.memo(function TimeSheetFilterPopover() {
	const [shouldRemoveItems, setShouldRemoveItems] = React.useState(false);
	const { activeTeam } = useOrganizationTeams();
	const { organizationProjects } = useOrganizationProjects();

	const { tasks } = useTeamTasks();
	const t = useTranslations();
	const { setEmployeeState, setProjectState, setStatusState, setTaskState, employee, project, statusState, task } =
		useTimelogFilterOptions();
	const { timesheet, statusTimesheet, isManage } = useTimesheet({})

	React.useEffect(() => {
		if (shouldRemoveItems) {
			setShouldRemoveItems(false);
		}
	}, [shouldRemoveItems]);
	const totalItems = React.useMemo(() => {
		if (!statusTimesheet) return 0;
		return Object.values(statusTimesheet).reduce((sum, status) => sum + status.length, 0);
	}, [statusTimesheet]);

	return (
		<>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="flex items-center justify-center  h-[2.2rem] rounded-lg bg-white dark:bg-dark--theme-light border dark:border-gray-700 hover:bg-white p-3 gap-2"
					>
						<SettingFilterIcon className="text-gray-700 dark:text-white w-3.5" strokeWidth="1.8" />
						<span className="text-gray-700 dark:text-white">{t('common.FILTER')}</span>
						{timesheet && timesheet.length > 0 && (
							<span
								role="status"
								aria-label={`${totalItems} items filtered`}
								className="rounded-full bg-primary dark:bg-primary-light h-7 w-7 flex items-center justify-center text-white text-center text-[12px]"
							>
								{totalItems > 100 ? "100+" : totalItems}
							</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-96">
					<div className="flex flex-col w-full">
						<div className="flex gap-2 mb-3 text-xl font-bold">
							<SettingFilterIcon className="w-4 text-gray-700 dark:text-white" strokeWidth="1.8" />
							<span className="text-gray-700 dark:text-white">{t('common.FILTER')}</span>
						</div>
						<div className="grid gap-5">
							{isManage && (
								<div className="">
									<label className="flex justify-between mb-1 text-sm text-gray-600">
										<span className="text-[12px]">{t('manualTime.EMPLOYEE')}</span>
										<span
											className={cn(
												'text-primary/10',
												employee?.length > 0 && 'text-primary dark:text-primary-light'
											)}
										>
											{t('common.CLEAR')}
										</span>
									</label>
									<MultiSelect
										localStorageKey="timesheet-select-filter-employee"
										removeItems={shouldRemoveItems}
										items={activeTeam?.members ?? []}
										itemToString={(members) => (members ? members.employee.fullName : '')}
										itemId={(item) => item.id}
										onValueChange={(selectedItems) => setEmployeeState(selectedItems as any)}
										multiSelect={true}
										triggerClassName="dark:border-gray-700"
									/>
								</div>
							)}
							<div className="">
								<label className="flex justify-between mb-1 text-sm text-gray-600">
									<span className="text-[12px]">{t('sidebar.PROJECTS')}</span>
									<span
										className={cn(
											'text-primary/10',
											project?.length > 0 && 'text-primary dark:text-primary-light'
										)}
									>
										{t('common.CLEAR')}
									</span>
								</label>
								<MultiSelect
									localStorageKey="timesheet-select-filter-projects"
									removeItems={shouldRemoveItems}
									items={organizationProjects ?? []}
									itemToString={(project) =>
										(organizationProjects && project ? project.name : '') || ''
									}
									itemId={(item) => item.id}
									onValueChange={(selectedItems) => setProjectState(selectedItems as any)}
									multiSelect={true}
									triggerClassName="dark:border-gray-700"
								/>
							</div>
							<div className="">
								<label className="flex justify-between mb-1 text-sm text-gray-600">
									<span className="text-[12px]">{t('hotkeys.TASK')}</span>
									<span
										className={cn(
											'text-primary/10',
											task?.length > 0 && 'text-primary dark:text-primary-light'
										)}
									>
										{t('common.CLEAR')}
									</span>
								</label>
								<MultiSelect
									localStorageKey="timesheet-select-filter-task"
									removeItems={shouldRemoveItems}
									items={tasks}
									onValueChange={(selectedItems) => setTaskState(selectedItems as any)}
									itemId={(task) => (task ? task.id : '')}
									itemToString={(task) => (task ? task.title : '')}
									multiSelect={true}
									triggerClassName="dark:border-gray-700"
								/>
							</div>
							<div className="">
								<label className="flex justify-between mb-1 text-sm text-gray-600">
									<span className="text-[12px]">{t('common.STATUS')}</span>
									<span
										className={cn(
											'text-primary/10',
											statusState && 'text-primary dark:text-primary-light'
										)}
									>
										{t('common.CLEAR')}
									</span>
								</label>
								<MultiSelect
									localStorageKey="timesheet-select-filter-status"
									removeItems={shouldRemoveItems}
									items={statusTable?.flat()}
									itemToString={(status) => (status ? status.label : '')}
									itemId={(item) => item.label}
									onValueChange={(selectedItems) => setStatusState(selectedItems as any)}
									multiSelect={true}
									triggerClassName="dark:border-gray-700"
								/>
							</div>
							<div className="flex items-center justify-end w-full gap-x-4">
								<Button
									onClick={() => setShouldRemoveItems(true)}
									variant={'outline'}
									className="flex items-center justify-center h-10 text-sm rounded-lg dark:text-gray-300"
								>
									<span className="text-sm">{t('common.CLEAR_FILTER')}</span>
								</Button>
								<Button className="flex items-center justify-center h-10 text-sm rounded-lg bg-primary dark:bg-primary-light dark:text-gray-300">
									<span className="text-sm">{t('common.APPLY_FILTER')}</span>
								</Button>
							</div>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
});
