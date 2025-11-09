import { Transition, Dialog } from "@headlessui/react";
import { Fragment, ReactNode } from "react";

import CrossIcon from "./icons/CrossIcon";

interface ModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  title: string;
  children?: ReactNode;
  onClose?: () => void;
}

function Modal({isOpen, setIsOpen, title, children, onClose=() => {}}: ModalProps) {

  const close = () => {
    setIsOpen(false);
    onClose();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-20" onClose={close}>
    <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
    >
        <div className="fixed inset-0 bg-brandDark/10 backdrop-blur" />
    </Transition.Child>

    <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-end sm:items-center justify-center p-4 text-center">
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">

            <Dialog.Title as="h3" className="text-2xl sm:text-3xl pt-3 pb-4 font-bold text-black dark:text-brandLight pr-14">{title}</Dialog.Title>
            <button
              type="button"
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 flex items-center justify-center transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
              onClick={close}
              aria-label="Close modal"
            >
              <CrossIcon className="fill-gray-900 dark:fill-white group-hover:fill-gray-700 dark:group-hover:fill-gray-200 h-4 w-4 transition-colors duration-200" />
            </button>

            {/* Main Content Options */}
            <div className="mt-4 flex flex-col gap-4">
              {children}
            </div>
            </Dialog.Panel>
        </Transition.Child>
        </div>
    </div>
    </Dialog>
</Transition>
   );
}

export default Modal;