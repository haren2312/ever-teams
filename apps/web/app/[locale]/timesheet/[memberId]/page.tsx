'use client';
import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import moment from 'moment';
import { useTranslations, TranslationHooks } from 'next-intl';

import { withAuthentication } from 'lib/app/authenticator';
import { Breadcrumb, Container } from 'lib/components';
import { MainLayout } from 'lib/layout';

import { useAuthenticateUser, useLocalStorageState, useModal, useOrganizationProjects, useOrganizationTeams } from '@app/hooks';
import { clsxm } from '@app/utils';
import { fullWidthState } from '@app/stores/fullWidth';
import { useAtomValue } from 'jotai';

import { ArrowLeftIcon } from 'assets/svg';
import { CalendarView, FilterStatus, TimesheetCard, TimesheetFilter, TimesheetView } from './components';
import { CalendarDaysIcon, Clock, User2 } from 'lucide-react';
import { GrTask } from 'react-icons/gr';
import { GoSearch } from 'react-icons/go';

import { getGreeting, secondsToTime } from '@/app/helpers';
import { useTimesheet } from '@/app/hooks/features/useTimesheet';
import { startOfWeek, endOfWeek } from 'date-fns';
import TimesheetDetailModal from './components/TimesheetDetailModal';

type TimesheetViewMode = 'ListView' | 'CalendarView';

type ViewToggleButtonProps = {
	mode: TimesheetViewMode;
	active: boolean;
	icon: React.ReactNode;
	onClick: () => void;
	t: TranslationHooks;
};

const TimeSheet = React.memo(function TimeSheetPage({ params }: { params: { memberId: string } }) {
	const t = useTranslations();
	const { user } = useAuthenticateUser();
	const { getOrganizationProjects } = useOrganizationProjects();

	const { isTrackingEnabled, activeTeam } = useOrganizationTeams();
	const [search, setSearch] = useState<string>('');
	const [filterStatus, setFilterStatus] = useLocalStorageState<FilterStatus>('timesheet-filter-status', 'All Tasks');
	const [timesheetNavigator, setTimesheetNavigator] = useLocalStorageState<TimesheetViewMode>(
		'timesheet-viewMode',
		'ListView'
	);

	const [dateRange, setDateRange] = React.useState<{ from: Date | null; to: Date | null }>({
		from: startOfWeek(new Date(), { weekStartsOn: 1 }),
		to: endOfWeek(new Date(), { weekStartsOn: 1 }),
	});
	const { timesheet, statusTimesheet, loadingTimesheet, isManage } = useTimesheet({
		startDate: dateRange.from!,
		endDate: dateRange.to!,
		timesheetViewMode: timesheetNavigator
	});

	React.useEffect(() => {
		getOrganizationProjects();
	}, [getOrganizationProjects])

	const lowerCaseSearch = useMemo(() => search?.toLowerCase() ?? '', [search]);
	const filterDataTimesheet = useMemo(() => {
		const filteredTimesheet =
			timesheet
				.filter((v) =>
					v.tasks.some(
						(task) =>
							task.task?.title?.toLowerCase()?.includes(lowerCaseSearch) ||
							task.employee?.fullName?.toLowerCase()?.includes(lowerCaseSearch) ||
							task.project?.name?.toLowerCase()?.includes(lowerCaseSearch)
					)
				);

		return filteredTimesheet;
	}, [
		timesheet,
		lowerCaseSearch,
	]);
	const {
		isOpen: isManualTimeModalOpen,
		openModal: openManualTimeModal,
		closeModal: closeManualTimeModal
	} = useModal();

	const {
		isOpen: isTimesheetDetailOpen,
		openModal: openTimesheetDetail,
		closeModal: closeTimesheetDetail
	} = useModal();

	const username = user?.name || user?.firstName || user?.lastName || user?.username;

	const totalDuration = Object.values(statusTimesheet)
		.flat()
		.map(entry => entry.timesheet.duration)
		.reduce((total, current) => total + current, 0);
	const { h: hours, m: minute } = secondsToTime(totalDuration || 0);

	const fullWidth = useAtomValue(fullWidthState);

	const paramsUrl = useParams<{ locale: string }>();
	const currentLocale = paramsUrl ? paramsUrl.locale : null;
	const breadcrumbPath = useMemo(
		() => [
			{ title: JSON.parse(t('pages.home.BREADCRUMB')), href: '/' },
			{ title: activeTeam?.name || '', href: '/' },
			{ title: t('pages.timesheet.TIMESHEET_TITLE'), href: `/${currentLocale}/timesheet/${params.memberId}` }
		],
		[activeTeam?.name, currentLocale, t]
	);
	return (
		<>
			{isTimesheetDetailOpen
				&& <TimesheetDetailModal
					closeModal={closeTimesheetDetail}
					isOpen={isTimesheetDetailOpen}
					timesheet={statusTimesheet}
				/>}

			<MainLayout
				showTimer={isTrackingEnabled}
				className="items-start pb-1 !overflow-hidden w-full"
				childrenClassName="w-full"
				mainHeaderSlot={
					<div className="flex flex-col py-4 bg-gray-100 dark:bg-dark--theme">
						<Container fullWidth={fullWidth} className="flex flex-col gap-y-2">
							<div className="flex flex-row items-start justify-between">
								<div className="flex items-center justify-center h-10 gap-8">
									<ArrowLeftIcon className="text-dark dark:text-[#6b7280] h-6 w-6" />
									<Breadcrumb paths={breadcrumbPath} className="text-sm" />
								</div>
							</div>

							<div className="flex flex-col items-start justify-start gap-y-2">
								<h1 className="!text-[23px] font-bold text-[#282048] dark:text-white">
									{getGreeting(t)}, {username} !
								</h1>
								<span className="text-sm text-[#3D5A80] dark:text-gray-500">
									{t('pages.timesheet.HEADING_DESCRIPTION')}
								</span>
							</div>
							<div className="flex items-center justify-between w-full gap-6 pt-4">
								<TimesheetCard
									count={statusTimesheet.PENDING.length}
									title={t('common.PENDING_TASKS')}
									description="Tasks waiting for your approval"
									icon={<GrTask className="font-bold" />}
									classNameIcon="bg-[#FBB650] shadow-[#fbb75095]"
									onClick={() => openTimesheetDetail()}
								/>
								<TimesheetCard
									hours={`${hours}:${minute}`}
									title={t('common.MEN_HOURS')}
									date={`${moment(dateRange.from).format('YYYY-MM-DD')} - ${moment(dateRange.to).format('YYYY-MM-DD')}`}
									icon={<Clock className="font-bold" />}
									classNameIcon="bg-[#3D5A80] shadow-[#3d5a809c] "
								/>
								{isManage && (<TimesheetCard
									count={Object.values(statusTimesheet)
										.flat()
										.map(entry => entry.employee.id)
										.filter((id, index, array) => array.indexOf(id) === index)
										.length}
									title={t('common.MEMBERS_WORKED')}
									description="People worked since last time"
									icon={<User2 className="font-bold" />}
									classNameIcon="bg-[#30B366] shadow-[#30b3678f]"
								/>)}
							</div>
							<div className="flex justify-between w-full overflow-hidden">
								<div className="flex w-full">
									<ViewToggleButton
										icon={<GrTask className="text-sm" />}
										mode="ListView"
										active={timesheetNavigator === 'ListView'}
										onClick={() => setTimesheetNavigator('ListView')}
										t={t}
									/>
									<ViewToggleButton
										icon={<CalendarDaysIcon size={20} className="!text-sm" />}
										mode="CalendarView"
										active={timesheetNavigator === 'CalendarView'}
										onClick={() => setTimesheetNavigator('CalendarView')}
										t={t}
									/>
								</div>
								<div className="flex items-center !h-[2.2rem] w-[700px] bg-white dark:bg-dark--theme-light gap-x-2 px-2 border border-gray-200 dark:border-gray-700 rounded-sm mb-2">
									<GoSearch className="text-[#7E7991]" />
									<input
										onChange={(v) => setSearch(v.target.value)}
										role="searchbox"
										aria-label="Search timesheet"
										type="search"
										name="timesheet-search"
										id="timesheet-search"
										className="!h-[2.2rem] w-full bg-transparent focus:border-transparent focus:ring-2 focus:ring-transparent placeholder-gray-500 placeholder:font-medium shadow-sm outline-none"
										placeholder={t('common.SEARCH')}
									/>
								</div>
							</div>
							<TimesheetFilter
								user={user}
								data={statusTimesheet}
								onChangeStatus={setFilterStatus}
								filterStatus={filterStatus}
								initDate={{
									initialRange: dateRange,
									onChange(range) {
										setDateRange(range);
									}
								}}
								closeModal={closeManualTimeModal}
								openModal={openManualTimeModal}
								isOpen={isManualTimeModalOpen}
								t={t}
							/>
						</Container>
					</div>
				}
			>
				<div className="flex flex-col w-full border-1 rounded-lg bg-[#FFFFFF] dark:bg-dark--theme px-4">
					<Container fullWidth={fullWidth} className="h-full py-5 mt-3">
						<div className="border border-gray-200 rounded-lg dark:border-gray-800">
							{timesheetNavigator === 'ListView' ? (
								<TimesheetView
									user={user}
									data={filterDataTimesheet}
									loading={loadingTimesheet}
								/>
							) : (
								<CalendarView
									user={user}
									data={filterDataTimesheet}
									loading={loadingTimesheet}
								/>
							)}
						</div>

					</Container>
				</div>
			</MainLayout>
		</>
	);
});

export default withAuthentication(TimeSheet, { displayName: 'TimeSheet', showPageSkeleton: true });

const ViewToggleButton: React.FC<ViewToggleButtonProps> = ({ mode, active, icon, onClick, t }) => (
	<button
		onClick={onClick}
		className={clsxm(
			'text-[#7E7991]  font-medium w-[191px] h-[40px] flex items-center gap-x-4 text-[14px] px-2 rounded',
			active &&
			'border-b-primary text-primary border-b-2 dark:text-primary-light dark:border-b-primary-light bg-[#F1F5F9] dark:bg-gray-800 font-bold'
		)}
	>
		{icon}
		<span>{mode === 'ListView' ? t('pages.timesheet.VIEWS.LIST') : t('pages.timesheet.VIEWS.CALENDAR')}</span>
	</button>
);
